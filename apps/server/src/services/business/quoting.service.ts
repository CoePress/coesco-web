/* eslint-disable node/prefer-global/buffer */
import type { QuoteDetails, QuoteHeader, QuoteItem, QuoteTerms } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { quoteDetailsService, quoteHeaderService, quoteItemService, quoteTermsService } from "@/services/repository";

export class QuotingService {
  async createQuote(data: any) {
    const currentYear = new Date().getFullYear().toString();
    const isDraft = data.status === "DRAFT" || !data.status;

    const quoteNumber = await this.getNextQuoteNumber(isDraft);

    // Create quote header
    const headerResult = await quoteHeaderService.create({
      ...data,
      year: currentYear,
      number: quoteNumber,
      priority: data.priority || "C",
      confidence: data.confidence || 0,
      legacy: data.legacy || {},
    });

    if (!headerResult.success) {
      throw new Error("Failed to create quote header");
    }

    // Create quote details
    const detailsResult = await quoteDetailsService.create({
      ...data,
      quoteHeaderId: headerResult.data.id,
      revision: "A",
      status: data.status || "DRAFT",
    });

    if (!detailsResult.success) {
      throw new Error("Failed to create quote details");
    }

    // Create items if provided
    if (data.items?.length) {
      await Promise.all(
        data.items.map((item: any) =>
          quoteItemService.create({
            ...item,
            quoteDetailsId: detailsResult.data.id,
          }),
        ),
      );
    }

    // Create terms if provided
    if (data.terms?.length) {
      await Promise.all(
        data.terms.map((term: any) =>
          quoteTermsService.create({
            ...term,
            quoteDetailsId: detailsResult.data.id,
          }),
        ),
      );
    }

    return { 
      success: true, 
      data: { 
        ...headerResult.data, 
        latestRevision: detailsResult.data,
        revision: detailsResult.data.revision,
        status: detailsResult.data.status,
        totalAmount: detailsResult.data.totalAmount || 0,
      } 
    };
  }

  async createQuoteRevision(quoteHeaderId: string, data: any) {
    const headerResult = await quoteHeaderService.getById(quoteHeaderId);

    if (!headerResult.success || !headerResult.data) {
      throw new Error("Quote header not found");
    }

    const nextRevision = await this.getNextQuoteRevision(headerResult.data.number, Number.parseInt(headerResult.data.year));

    const detailsResult = await quoteDetailsService.create({
      ...data,
      quoteHeaderId,
      revision: nextRevision,
      status: data.status || "DRAFT",
    });

    if (!detailsResult.success) {
      throw new Error("Failed to create quote revision");
    }

    // Create items if provided
    if (data.items?.length) {
      await Promise.all(
        data.items.map((item: any) =>
          quoteItemService.create({
            ...item,
            quoteDetailsId: detailsResult.data.id,
          }),
        ),
      );
    }

    // Create terms if provided
    if (data.terms?.length) {
      await Promise.all(
        data.terms.map((term: any) =>
          quoteTermsService.create({
            ...term,
            quoteDetailsId: detailsResult.data.id,
          }),
        ),
      );
    }

    return detailsResult.data;
  }

  async getAllQuotesWithLatestRevision(params?: IQueryParams<QuoteHeader>) {
    const headersResult = await quoteHeaderService.getAll(params);

    if (!headersResult.success || !headersResult.data?.length) {
      return {
        success: true,
        data: [],
        meta: headersResult.meta || {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const quotesWithRevisions = await Promise.all(
      headersResult.data.map(async (header: QuoteHeader) => {
        const latestRevisionResult = await quoteDetailsService.getAll({
          filter: { quoteHeaderId: header.id },
          sort: "revision",
          order: "desc",
          limit: 1,
        });

        const latestRevision = latestRevisionResult.data?.[0] || null;
        
        return {
          ...header,
          revision: latestRevision?.revision || "A",
          status: latestRevision?.status || "DRAFT",
          totalAmount: latestRevision?.totalAmount || 0,
          latestRevision,
        };
      }),
    );

    return {
      success: true,
      data: quotesWithRevisions,
      meta: headersResult.meta,
    };
  }

  async getQuoteWithDetails(id: string) {
    const headerResult = await quoteHeaderService.getById(id);

    if (!headerResult.success || !headerResult.data) {
      throw new Error("Quote not found");
    }

    const revisionsResult = await quoteDetailsService.getAll({
      filter: { quoteHeaderId: id },
      sort: "revision",
      order: "desc",
    });

    const revisions = revisionsResult.data || [];

    // Get items and terms for each revision
    const revisionsWithDetails = await Promise.all(
      revisions.map(async (revision: QuoteDetails) => {
        const [itemsResult, termsResult] = await Promise.all([
          quoteItemService.getAll({ filter: { quoteDetailsId: revision.id } }),
          quoteTermsService.getAll({ filter: { quoteDetailsId: revision.id } }),
        ]);

        return {
          ...revision,
          items: itemsResult.data || [],
          terms: termsResult.data || [],
        };
      }),
    );

    return {
      success: true,
      data: {
        ...headerResult.data,
        revisions: revisionsWithDetails,
        latestRevision: revisionsWithDetails[0] || null,
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

    // Update quote details
    const detailsResult = await quoteDetailsService.update(latestRevision.id, data);

    // Update items if provided
    if (data.items) {
      // Delete existing items
      const existingItems = await quoteItemService.getAll({
        filter: { quoteDetailsId: latestRevision.id },
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
              quoteDetailsId: latestRevision.id,
            }),
          ),
        );
      }
    }

    // Update terms if provided
    if (data.terms) {
      // Delete existing terms
      const existingTerms = await quoteTermsService.getAll({
        filter: { quoteDetailsId: latestRevision.id },
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
              quoteDetailsId: latestRevision.id,
            }),
          ),
        );
      }
    }

    return detailsResult;
  }

  async deleteQuote(id: string) {
    const result = await quoteHeaderService.delete(id);
    return result;
  }

  async getQuoteRevisions(id: string) {
    const revisionsResult = await quoteDetailsService.getAll({
      filter: { quoteHeaderId: id },
      sort: "revision",
      order: "asc",
    });

    return revisionsResult;
  }

  async approveQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteDetailsService.update(quoteResult.data.latestRevision.id, {
      status: "APPROVED",
    });

    return result;
  }

  async acceptQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteDetailsService.update(quoteResult.data.latestRevision.id, {
      status: "ACCEPTED",
    });

    return result;
  }

  async rejectQuote(id: string) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteDetailsService.update(quoteResult.data.latestRevision.id, {
      status: "REJECTED",
    });

    return result;
  }

  async sendQuote(id: string, data: any) {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const result = await quoteDetailsService.update(quoteResult.data.latestRevision.id, {
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

    const quotesResult = await quoteHeaderService.getAll({
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

    const headerResult = await quoteHeaderService.getAll({
      filter: {
        year: currentYear,
        number: quoteNumber,
      } as any,
      limit: 1,
    });

    if (!headerResult.success || !headerResult.data?.length) {
      return "A";
    }

    const quoteHeaderId = headerResult.data[0].id;

    const revisionsResult = await quoteDetailsService.getAll({
      filter: {
        quoteHeaderId,
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
}
