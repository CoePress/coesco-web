import logger from "./logger";
import { connectionManager } from "./odbc-connection";

export interface QuoteLineItem {
  lineItem: string;
  description: string;
  price: number;
}

export interface QuoteValueResult {
  quoteValue: number;
  revision: string;
  lineItems: QuoteLineItem[];
}

/**
 * Domain service for quote-related operations on the legacy quote database.
 * Handles quote value calculations, revision lookups, and line item retrieval.
 */
export class QuoteService {
  private getConnection() {
    return connectionManager.get("quote");
  }

  /**
   * Parse a quote key string (e.g., "24-00123" or "2024-00123") into year and number.
   */
  private parseQuoteKey(quoteKey: string): { year2Digit: number; year4Digit: number; num: number } | null {
    if (!quoteKey) {
      return null;
    }

    const parts = quoteKey.split("-");
    if (parts.length < 2) {
      return null;
    }

    const qyear = Number.parseInt(parts[0], 10);
    const qnum = Number.parseInt(parts[1], 10);

    if (Number.isNaN(qyear) || Number.isNaN(qnum)) {
      return null;
    }

    return {
      year2Digit: qyear < 100 ? qyear : qyear % 100,
      year4Digit: qyear < 100 ? 2000 + qyear : qyear,
      num: qnum,
    };
  }

  /**
   * Get the total value, latest revision, and line items for a quote.
   * Returns the most recent revision's data.
   */
  async getQuoteValue(quoteKey: string): Promise<QuoteValueResult> {
    const empty: QuoteValueResult = { quoteValue: 0, revision: "", lineItems: [] };

    const parsed = this.parseQuoteKey(quoteKey);
    if (!parsed) {
      return empty;
    }

    const connection = this.getConnection();
    if (!connection) {
      logger.warn("No connection to quote database");
      return empty;
    }

    const { year2Digit, year4Digit, num } = parsed;

    // Query to get revision totals, ordered by revision descending
    const summaryQuery = `
      SELECT QRev, SUM(salesprice) as total
      FROM PUB.qrevcostsheet
      WHERE (qyear = ${year2Digit} OR qyear = ${year4Digit}) AND qnum = ${num}
      GROUP BY QRev
      ORDER BY QRev DESC
    `;

    try {
      const summaryResult = await connection.query(summaryQuery) as Record<string, unknown>[];

      if (!summaryResult || summaryResult.length === 0) {
        return empty;
      }

      // Parse and sort revisions (handle case variations)
      const revisions = summaryResult
        .map((row) => ({
          qrev: String(row.QRev ?? row.qrev ?? row.QREV ?? row.Qrev ?? "").trim() || "a",
          total: Number(row.total ?? row.TOTAL ?? row.Total ?? 0),
        }))
        .sort((a, b) => b.qrev.localeCompare(a.qrev));

      const latestRevision = revisions[0];

      // Query line items for the latest revision
      const lineItemsQuery = `
        SELECT lineItem, Description, salesprice
        FROM PUB.qrevcostsheet
        WHERE (qyear = ${year2Digit} OR qyear = ${year4Digit})
          AND qnum = ${num}
          AND (QRev = '${latestRevision.qrev.replace(/'/g, "''")}'
               OR (QRev IS NULL AND '${latestRevision.qrev}' = 'a'))
        ORDER BY lineItem
      `;

      const lineItemsResult = await connection.query(lineItemsQuery) as Record<string, unknown>[];

      const lineItems: QuoteLineItem[] = (lineItemsResult ?? []).map((row) => ({
        lineItem: String(row.lineItem ?? row.LINEITEM ?? row.LineItem ?? "").trim() || "-",
        description: String(row.Description ?? row.DESCRIPTION ?? row.description ?? "").trim() || "-",
        price: Number(row.salesprice ?? row.SALESPRICE ?? row.SalesPrice ?? 0),
      }));

      return {
        quoteValue: latestRevision.total,
        revision: latestRevision.qrev,
        lineItems,
      };
    }
    catch (err) {
      logger.error("Error in getQuoteValue:", err);
      return empty;
    }
  }

  /**
   * Get all revisions for a quote with their totals.
   */
  async getQuoteRevisions(quoteKey: string): Promise<Array<{ revision: string; total: number }>> {
    const parsed = this.parseQuoteKey(quoteKey);
    if (!parsed) {
      return [];
    }

    const connection = this.getConnection();
    if (!connection) {
      return [];
    }

    const { year2Digit, year4Digit, num } = parsed;

    const query = `
      SELECT QRev, SUM(salesprice) as total
      FROM PUB.qrevcostsheet
      WHERE (qyear = ${year2Digit} OR qyear = ${year4Digit}) AND qnum = ${num}
      GROUP BY QRev
      ORDER BY QRev ASC
    `;

    try {
      const result = await connection.query(query) as Record<string, unknown>[];

      return (result ?? []).map((row) => ({
        revision: String(row.QRev ?? row.qrev ?? row.QREV ?? "").trim() || "a",
        total: Number(row.total ?? row.TOTAL ?? row.Total ?? 0),
      }));
    }
    catch (err) {
      logger.error("Error in getQuoteRevisions:", err);
      return [];
    }
  }

  /**
   * Check if a quote exists in the legacy system.
   */
  async quoteExists(quoteKey: string): Promise<boolean> {
    const parsed = this.parseQuoteKey(quoteKey);
    if (!parsed) {
      return false;
    }

    const connection = this.getConnection();
    if (!connection) {
      return false;
    }

    const { year2Digit, year4Digit, num } = parsed;

    const query = `
      SELECT 1
      FROM PUB.qrevcostsheet
      WHERE (qyear = ${year2Digit} OR qyear = ${year4Digit}) AND qnum = ${num}
      FETCH FIRST 1 ROW ONLY
    `;

    try {
      const result = await connection.query(query);
      return result && result.length > 0;
    }
    catch {
      return false;
    }
  }
}

export const quoteService = new QuoteService();
