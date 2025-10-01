/* eslint-disable node/prefer-global/buffer */
import type { Quote, QuoteItem, QuoteTerms } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { quoteItemService, quoteRevisionService, quoteService, quoteTermsService } from "@/services/repository";

export class QuotingService {
  async createQuote(data: any) {
    const currentYear = new Date().getFullYear().toString();
    const isDraft = data.status === "DRAFT" || !data.status;

    const quoteNumber = await this.getNextQuoteNumber(isDraft);

    const quoteResult = await quoteService.create({
      ...data,
      year: currentYear,
      number: quoteNumber,
      priority: data.priority || "C",
      confidence: data.confidence || 0,
      legacy: data.legacy || {},
    });

    if (!quoteResult.success) {
      throw new Error("Failed to create quote");
    }

    const revisionResult = await quoteRevisionService.create({
      ...data,
      quoteId: quoteResult.data.id,
      revision: "A",
      status: data.status || "DRAFT",
    });

    if (!revisionResult.success) {
      throw new Error("Failed to create quote revision");
    }

    if (data.items?.length) {
      await Promise.all(
        data.items.map((item: any) =>
          quoteItemService.create({
            ...item,
            quoteRevisionId: revisionResult.data.id,
          }),
        ),
      );
    }

    if (data.terms?.length) {
      await Promise.all(
        data.terms.map((term: any) =>
          quoteTermsService.create({
            ...term,
            quoteRevisionId: revisionResult.data.id,
          }),
        ),
      );
    }

    return {
      success: true,
      data: {
        ...quoteResult.data,
        latestRevision: revisionResult.data,
        revision: revisionResult.data.revision,
        status: revisionResult.data.status,
        totalAmount: revisionResult.data.totalAmount || 0,
      },
    };
  }

  async createQuoteRevision(quoteId: string, data: any) {
    const quoteResult = await quoteService.getById(quoteId);

    if (!quoteResult.success || !quoteResult.data) {
      throw new Error("Quote not found");
    }

    const nextRevision = await this.getNextQuoteRevision(quoteResult.data.number, Number.parseInt(quoteResult.data.year));

    const revisionResult = await quoteRevisionService.create({
      ...data,
      quoteId,
      revision: nextRevision,
      status: data.status || "DRAFT",
    });

    if (!revisionResult.success) {
      throw new Error("Failed to create quote revision");
    }

    if (data.items?.length) {
      await Promise.all(
        data.items.map((item: any) =>
          quoteItemService.create({
            ...item,
            quoteRevisionId: revisionResult.data.id,
          }),
        ),
      );
    }

    if (data.terms?.length) {
      await Promise.all(
        data.terms.map((term: any) =>
          quoteTermsService.create({
            ...term,
            quoteRevisionId: revisionResult.data.id,
          }),
        ),
      );
    }

    return revisionResult.data;
  }

  async getAllQuotesWithLatestRevision(params?: IQueryParams<Quote>) {
    const quotesResult = await quoteService.getAll(params);

    if (!quotesResult.success || !quotesResult.data?.length) {
      return {
        success: true,
        data: [],
        meta: quotesResult.meta || {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const quotesWithRevisions = await Promise.all(
      quotesResult.data.map(async (quote: Quote) => {
        const latestRevisionResult = await quoteRevisionService.getAll({
          filter: { quoteId: quote.id },
          sort: "revision",
          order: "desc",
          limit: 1,
        });

        const latestRevision = latestRevisionResult.data?.[0] || null;

        return {
          ...quote,
          revision: latestRevision?.revision || "A",
          revisionStatus: latestRevision?.status || "DRAFT",
          totalAmount: latestRevision?.totalAmount || 0,
          latestRevision,
        };
      }),
    );

    return {
      success: true,
      data: quotesWithRevisions,
      meta: quotesResult.meta,
    };
  }

  async getQuoteWithDetails(id: string) {
    const quoteResult = await quoteService.getById(id);

    if (!quoteResult.success || !quoteResult.data) {
      throw new Error("Quote not found");
    }

    // Get the latest revision
    const latestRevisionResult = await quoteRevisionService.getAll({
      filter: { quoteId: id },
      sort: "revision",
      order: "desc",
      limit: 1,
    });

    const latestRevision = latestRevisionResult.data?.[0] || null;

    if (!latestRevision) {
      throw new Error("No revisions found for quote");
    }

    // Get items and terms for the latest revision
    const [itemsResult, termsResult] = await Promise.all([
      quoteItemService.getAll({ filter: { quoteRevisionId: latestRevision.id } }),
      quoteTermsService.getAll({ filter: { quoteRevisionId: latestRevision.id } }),
    ]);

    return {
      success: true,
      data: {
        ...quoteResult.data,
        latestRevision: {
          ...latestRevision,
          items: itemsResult.data || [],
          terms: termsResult.data || [],
        },
        revision: latestRevision.revision,
        status: latestRevision.status,
        totalAmount: latestRevision.totalAmount || 0,
        quoteItems: itemsResult.data || [],
      },
    };
  }

  async updateQuote(id: string, data: any) {
    // Get the latest revision
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const latestRevision = quoteResult.data.latestRevision;

    // Update quote revision
    const revisionResult = await quoteRevisionService.update(latestRevision.id, data);

    // Update items if provided
    if (data.items) {
      // Delete existing items
      const existingItems = await quoteItemService.getAll({
        filter: { quoteRevisionId: latestRevision.id },
      });

      if (existingItems.success && existingItems.data) {
        await Promise.all(
          existingItems.data.map((item: QuoteItem) => quoteItemService.delete(item.id)),
        );
      }

      // Create new items
      if (data.items.length > 0) {
        await Promise.all(
          data.items.map((item: any) =>
            quoteItemService.create({
              ...item,
              quoteRevisionId: latestRevision.id,
            }),
          ),
        );
      }
    }

    // Update terms if provided
    if (data.terms) {
      // Delete existing terms
      const existingTerms = await quoteTermsService.getAll({
        filter: { quoteRevisionId: latestRevision.id },
      });

      if (existingTerms.success && existingTerms.data) {
        await Promise.all(
          existingTerms.data.map((term: QuoteTerms) => quoteTermsService.delete(term.id)),
        );
      }

      // Create new terms
      if (data.terms.length > 0) {
        await Promise.all(
          data.terms.map((term: any) =>
            quoteTermsService.create({
              ...term,
              quoteRevisionId: latestRevision.id,
            }),
          ),
        );
      }
    }

    return revisionResult;
  }

  async deleteQuote(id: string) {
    const result = await quoteService.delete(id);
    return result;
  }

  async getQuoteRevisions(id: string) {
    const revisionsResult = await quoteRevisionService.getAll({
      filter: { quoteId: id },
      sort: "revision",
      order: "asc",
    });

    return revisionsResult;
  }

  async getQuoteRevision(quoteId: string, revisionId: string) {
    const revisionResult = await quoteRevisionService.getById(revisionId);

    if (!revisionResult.success || !revisionResult.data) {
      throw new Error("Quote revision not found");
    }

    // Verify the revision belongs to the quote
    if (revisionResult.data.quoteId !== quoteId) {
      throw new Error("Quote revision not found");
    }

    // Get quote info
    const quoteResult = await quoteService.getById(quoteId);
    if (!quoteResult.success || !quoteResult.data) {
      throw new Error("Quote not found");
    }

    // Get items and terms for this revision
    const [itemsResult, termsResult] = await Promise.all([
      quoteItemService.getAll({ filter: { quoteRevisionId: revisionId } }),
      quoteTermsService.getAll({ filter: { quoteRevisionId: revisionId } }),
    ]);

    return {
      success: true,
      data: {
        ...quoteResult.data,
        latestRevision: {
          ...revisionResult.data,
          items: itemsResult.data || [],
          terms: termsResult.data || [],
        },
        revision: revisionResult.data.revision,
        status: revisionResult.data.status,
        totalAmount: revisionResult.data.totalAmount || 0,
      },
    };
  }

  async approveQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteRevisionService.update(quoteResult.data.latestRevision.id, {
      status: "APPROVED",
    });

    return result;
  }

  async acceptQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteRevisionService.update(quoteResult.data.latestRevision.id, {
      status: "ACCEPTED",
    });

    return result;
  }

  async rejectQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteRevisionService.update(quoteResult.data.latestRevision.id, {
      status: "REJECTED",
    });

    return result;
  }

  async sendQuote(id: string, data: any) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteRevisionService.update(quoteResult.data.latestRevision.id, {
      status: "SENT",
      sentById: data.sentById,
    });

    return result;
  }

  async exportQuotePDF(id: string): Promise<Buffer> {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    return Buffer.from("PDF placeholder");
  }

  async getNextQuoteNumber(isDraft: boolean = false): Promise<string> {
    const currentYear = new Date().getFullYear().toString();

    const quotesResult = await quoteService.getAll({
      filter: {
        year: currentYear,
        number: {
          not: {
            startsWith: "DRAFT-",
          },
        },
      } as any,
      sort: "number",
      order: "desc",
      limit: 1,
    });

    let nextNumber: string;

    if (!quotesResult.success || !quotesResult.data?.length || !quotesResult.data[0].number) {
      nextNumber = `${currentYear}0001`;
    }
    else {
      const lastQuote = quotesResult.data[0];
      const currentNumber = lastQuote.number.replace(/^DRAFT-/, "");
      const numericPart = Number.parseInt(currentNumber.slice(-4));
      const nextNumericPart = (numericPart + 1).toString().padStart(4, "0");
      nextNumber = currentYear + nextNumericPart;
    }

    return isDraft ? `DRAFT-${nextNumber}` : nextNumber;
  }

  async getNextQuoteRevision(quoteNumber: string, year?: number): Promise<string> {
    const currentYear = (year || new Date().getFullYear()).toString();

    const quoteResult = await quoteService.getAll({
      filter: {
        year: currentYear,
        number: quoteNumber,
      } as any,
      limit: 1,
    });

    if (!quoteResult.success || !quoteResult.data?.length) {
      return "A";
    }

    const quoteId = quoteResult.data[0].id;

    const revisionsResult = await quoteRevisionService.getAll({
      filter: {
        quoteId,
      } as any,
      sort: "revision",
      order: "desc",
    });

    if (!revisionsResult.success || !revisionsResult.data?.length) {
      return "A";
    }

    const lastRevision = revisionsResult.data[0].revision;

    if (!lastRevision || lastRevision === "") {
      return "A";
    }

    if (/^\d+$/.test(lastRevision)) {
      return (Number.parseInt(lastRevision) + 1).toString();
    }

    if (/^[A-Z]$/.test(lastRevision)) {
      if (lastRevision === "Z") {
        return "AA";
      }
      return String.fromCharCode(lastRevision.charCodeAt(0) + 1);
    }

    if (/^[A-Z]{2}$/.test(lastRevision)) {
      const firstChar = lastRevision[0];
      const secondChar = lastRevision[1];

      if (secondChar === "Z") {
        if (firstChar === "Z") {
          return "AAA";
        }
        return `${String.fromCharCode(firstChar.charCodeAt(0) + 1)}A`;
      }
      return firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
    }

    return "A";
  }

  async getQuoteMetrics() {
    const quotesResult = await quoteService.getAll({
      filter: { status: "OPEN" },
    });

    if (!quotesResult.success || !quotesResult.data?.length) {
      return {
        success: true,
        data: {
          totalQuoteValue: 0,
          totalQuoteCount: 0,
          averageQuoteValue: 0,
          quotesByStatus: {
            DRAFT: 0,
            APPROVED: 0,
            SENT: 0,
            ACCEPTED: 0,
          },
        },
      };
    }

    let totalValue = 0;
    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      APPROVED: 0,
      SENT: 0,
      ACCEPTED: 0,
      REVISED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };

    await Promise.all(
      quotesResult.data.map(async (quote: Quote) => {
        const latestRevisionResult = await quoteRevisionService.getAll({
          filter: { quoteId: quote.id },
          sort: "revision",
          order: "desc",
          limit: 1,
        });

        const latestRevision = latestRevisionResult.data?.[0];
        if (latestRevision) {
          const itemsResult = await quoteItemService.getAll({
            filter: { quoteRevisionId: latestRevision.id },
          });

          if (itemsResult.success && itemsResult.data) {
            const revisionTotal = itemsResult.data.reduce(
              (sum: number, item: QuoteItem) =>
                sum + Number(item.unitPrice) * item.quantity,
              0,
            );
            totalValue += revisionTotal;
          }

          const status = latestRevision.status;
          if (status && status in statusCounts) {
            statusCounts[status]++;
          }
        }
      }),
    );

    const totalCount = quotesResult.data.length;
    const averageValue = totalCount > 0 ? totalValue / totalCount : 0;

    return {
      success: true,
      data: {
        totalQuoteValue: totalValue,
        totalQuoteCount: totalCount,
        averageQuoteValue: averageValue,
        quotesByStatus: statusCounts,
      },
    };
  }
}
