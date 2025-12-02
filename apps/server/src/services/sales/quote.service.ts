/* eslint-disable node/prefer-global/buffer */
import type { Quote, QuoteItem, QuoteTerms } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { companyRepository, journeyRepository, quoteItemRepository, quoteRepository, quoteRevisionRepository, quoteTermsRepository } from "@/repositories";
import { contextStorage } from "@/utils/context";
import { prisma } from "@/utils/prisma";

export class QuoteService {
  async createQuote(data: any) {
    const ctx = contextStorage.getStore();
    return await contextStorage.run(ctx!, async () => prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear().toString();
      const isDraft = data.status === "DRAFT" || !data.status;

      const quoteNumber = await this.getNextQuoteNumber(isDraft);

      let customerId = data.customerId;
      let journeyId = data.journeyId;

      if (data.customerName) {
        const customerResult = await companyRepository.create({
          name: data.customerName,
          type: "CUSTOMER",
        }, tx);

        if (!customerResult.success) {
          throw new Error("Failed to create customer");
        }

        customerId = customerResult.data.id;
      }

      if (data.journeyName) {
        if (!customerId) {
          throw new Error("Customer is required to create a journey");
        }

        const journeyResult = await journeyRepository.create({
          name: data.journeyName,
          customerId,
        }, tx);

        if (!journeyResult.success) {
          throw new Error("Failed to create journey");
        }

        journeyId = journeyResult.data.id;
      }

      const quoteResult = await quoteRepository.create({
        journeyId,
        customerId,
        year: currentYear,
        number: quoteNumber,
        rsmId: data.rsmId,
        customerContactId: data.customerContactId,
        customerAddressId: data.customerAddressId,
        dealerId: data.dealerId,
        dealerContactId: data.dealerContactId,
        dealerAddressId: data.dealerAddressId,
        priority: data.priority || "C",
        confidence: data.confidence ?? 0,
        status: data.status || "OPEN",
        legacy: data.legacy || {},
        latestRevision: "A",
        latestRevisionStatus: data.revisionStatus || "DRAFT",
        latestRevisionTotalAmount: data.totalAmount || 0,
      }, tx);

      if (!quoteResult.success) {
        throw new Error("Failed to create quote");
      }

      const revisionResult = await quoteRevisionRepository.create({
        quoteId: quoteResult.data.id,
        revision: "A",
        status: data.revisionStatus || "DRAFT",
        quoteDate: data.quoteDate,
        totalAmount: data.totalAmount,
      }, tx);

      if (!revisionResult.success) {
        throw new Error("Failed to create quote revision");
      }

      if (data.items?.length) {
        await Promise.all(
          data.items.map((item: any) =>
            quoteItemRepository.create({
              ...item,
              quoteRevisionId: revisionResult.data.id,
            }, tx),
          ),
        );
      }

      if (data.terms?.length) {
        await Promise.all(
          data.terms.map((term: any) =>
            quoteTermsRepository.create({
              ...term,
              quoteRevisionId: revisionResult.data.id,
            }, tx),
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
    }));
  }

  async createQuoteRevision(quoteId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await quoteRepository.getById(quoteId, undefined, tx);

      if (!quoteResult.success || !quoteResult.data) {
        throw new Error("Quote not found");
      }

      const nextRevision = await this.getNextQuoteRevision(quoteResult.data.number, Number.parseInt(quoteResult.data.year));

      const { items: _items, terms: _terms, ...revisionData } = data;
      const revisionResult = await quoteRevisionRepository.create({
        ...revisionData,
        quoteId,
        revision: nextRevision,
        status: data.status || "DRAFT",
      }, tx);

      if (!revisionResult.success) {
        throw new Error("Failed to create quote revision");
      }

      if (data.items?.length) {
        await Promise.all(
          data.items.map((item: any) =>
            quoteItemRepository.create({
              ...item,
              quoteRevisionId: revisionResult.data.id,
            }, tx),
          ),
        );
      }

      if (data.terms?.length) {
        await Promise.all(
          data.terms.map((term: any) =>
            quoteTermsRepository.create({
              ...term,
              quoteRevisionId: revisionResult.data.id,
            }, tx),
          ),
        );
      }

      await quoteRepository.update(quoteId, {
        latestRevision: nextRevision,
        latestRevisionStatus: revisionResult.data.status,
        latestRevisionTotalAmount: revisionResult.data.totalAmount || 0,
      }, tx);

      return revisionResult.data;
    });
  }

  private compareRevisions(a: string, b: string): number {
    const aIsNumeric = /^\d+$/.test(a);
    const bIsNumeric = /^\d+$/.test(b);

    if (aIsNumeric && bIsNumeric) {
      return Number.parseInt(a) - Number.parseInt(b);
    }

    if (aIsNumeric !== bIsNumeric) {
      return aIsNumeric ? -1 : 1;
    }

    if (a.length !== b.length) {
      return a.length - b.length;
    }

    return a.localeCompare(b);
  }

  async getAllQuotesWithLatestRevision(params?: IQueryParams<Quote>) {
    const quotesResult = await quoteRepository.getAll(params);

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

    const quotesWithRevisions = quotesResult.data.map((quote: any) => ({
      ...quote,
      revisionStatus: quote.latestRevisionStatus || "DRAFT",
      totalAmount: quote.latestRevisionTotalAmount || 0,
    }));

    return {
      success: true,
      data: quotesWithRevisions,
      meta: quotesResult.meta,
    };
  }

  private enrichQuoteItems(items: QuoteItem[]) {
    return items.map(item => ({
      ...item,
      totalPrice: Number(item.unitPrice) * item.quantity,
    }));
  }

  private async getEmployeeNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
    const validIds = ids.filter((id): id is string => !!id);
    if (validIds.length === 0)
      return new Map();

    const employees = await prisma.employee.findMany({
      where: { id: { in: validIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    return new Map(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]));
  }

  async getQuoteWithDetails(id: string) {
    const quoteResult = await quoteRepository.getById(id);

    if (!quoteResult.success || !quoteResult.data) {
      throw new Error("Quote not found");
    }

    // Get the latest revision
    const latestRevisionResult = await quoteRevisionRepository.getAll({
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
      quoteItemRepository.getAll({ filter: { quoteRevisionId: latestRevision.id } }),
      quoteTermsRepository.getAll({ filter: { quoteRevisionId: latestRevision.id } }),
    ]);

    const enrichedItems = this.enrichQuoteItems(itemsResult.data || []);
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get employee names for all ById fields
    const quote = quoteResult.data;
    const employeeIds = [
      quote.rsmId,
      quote.createdById,
      quote.updatedById,
      latestRevision.approvedById,
      latestRevision.sentById,
      latestRevision.createdById,
      latestRevision.updatedById,
    ];
    const employeeNames = await this.getEmployeeNames(employeeIds);

    return {
      success: true,
      data: {
        ...quote,
        rsm: quote.rsmId ? employeeNames.get(quote.rsmId) : null,
        createdBy: employeeNames.get(quote.createdById) || null,
        updatedBy: employeeNames.get(quote.updatedById) || null,
        latestRevision: {
          ...latestRevision,
          items: enrichedItems,
          terms: termsResult.data || [],
          approvedBy: latestRevision.approvedById ? employeeNames.get(latestRevision.approvedById) : null,
          sentBy: latestRevision.sentById ? employeeNames.get(latestRevision.sentById) : null,
          createdBy: employeeNames.get(latestRevision.createdById) || null,
          updatedBy: employeeNames.get(latestRevision.updatedById) || null,
        },
        revision: latestRevision.revision,
        status: latestRevision.status,
        totalAmount,
        quoteItems: enrichedItems,
      },
    };
  }

  async updateQuote(id: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await this.getQuoteWithDetails(id);
      if (!quoteResult.success || !quoteResult.data.latestRevision) {
        throw new Error("Quote or latest revision not found");
      }

      const latestRevision = quoteResult.data.latestRevision;

      const { items, terms, ...revisionData } = data;
      let revisionResult = { success: true, data: latestRevision };

      if (Object.keys(revisionData).length > 0) {
        revisionResult = await quoteRevisionRepository.update(latestRevision.id, revisionData, tx);
      }

      if (items) {
        const existingItems = await quoteItemRepository.getAll({
          filter: { quoteRevisionId: latestRevision.id },
        });

        if (existingItems.success && existingItems.data) {
          await Promise.all(
            existingItems.data.map((item: QuoteItem) => quoteItemRepository.delete(item.id, tx)),
          );
        }

        if (items.length > 0) {
          await Promise.all(
            items.map((item: any) =>
              quoteItemRepository.create({
                ...item,
                quoteRevisionId: latestRevision.id,
              }, tx),
            ),
          );
        }
      }

      if (terms) {
        const existingTerms = await quoteTermsRepository.getAll({
          filter: { quoteRevisionId: latestRevision.id },
        });

        if (existingTerms.success && existingTerms.data) {
          await Promise.all(
            existingTerms.data.map((term: QuoteTerms) => quoteTermsRepository.delete(term.id, tx)),
          );
        }

        if (terms.length > 0) {
          await Promise.all(
            terms.map((term: any) =>
              quoteTermsRepository.create({
                ...term,
                quoteRevisionId: latestRevision.id,
              }, tx),
            ),
          );
        }
      }

      if (revisionResult.success) {
        await quoteRepository.update(id, {
          latestRevisionStatus: revisionResult.data.status,
          latestRevisionTotalAmount: revisionResult.data.totalAmount,
        }, tx);
      }

      return revisionResult;
    });
  }

  async deleteQuote(id: string) {
    const result = await quoteRepository.delete(id);
    return result;
  }

  async getQuoteRevisions(id: string) {
    const revisionsResult = await quoteRevisionRepository.getAll({
      filter: { quoteId: id },
      sort: "revision",
      order: "asc",
    });

    return revisionsResult;
  }

  async getQuoteRevision(quoteId: string, revisionId: string) {
    const revisionResult = await quoteRevisionRepository.getById(revisionId);

    if (!revisionResult.success || !revisionResult.data) {
      throw new Error("Quote revision not found");
    }

    // Verify the revision belongs to the quote
    if (revisionResult.data.quoteId !== quoteId) {
      throw new Error("Quote revision not found");
    }

    // Get quote info
    const quoteResult = await quoteRepository.getById(quoteId);
    if (!quoteResult.success || !quoteResult.data) {
      throw new Error("Quote not found");
    }

    // Get items and terms for this revision
    const [itemsResult, termsResult] = await Promise.all([
      quoteItemRepository.getAll({ filter: { quoteRevisionId: revisionId } }),
      quoteTermsRepository.getAll({ filter: { quoteRevisionId: revisionId } }),
    ]);

    const enrichedItems = this.enrichQuoteItems(itemsResult.data || []);
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get employee names for all ById fields
    const quote = quoteResult.data;
    const revision = revisionResult.data;
    const employeeIds = [
      quote.rsmId,
      quote.createdById,
      quote.updatedById,
      revision.approvedById,
      revision.sentById,
      revision.createdById,
      revision.updatedById,
    ];
    const employeeNames = await this.getEmployeeNames(employeeIds);

    return {
      success: true,
      data: {
        ...quote,
        rsm: quote.rsmId ? employeeNames.get(quote.rsmId) : null,
        createdBy: employeeNames.get(quote.createdById) || null,
        updatedBy: employeeNames.get(quote.updatedById) || null,
        latestRevision: {
          ...revision,
          items: enrichedItems,
          terms: termsResult.data || [],
          approvedBy: revision.approvedById ? employeeNames.get(revision.approvedById) : null,
          sentBy: revision.sentById ? employeeNames.get(revision.sentById) : null,
          createdBy: employeeNames.get(revision.createdById) || null,
          updatedBy: employeeNames.get(revision.updatedById) || null,
        },
        revision: revision.revision,
        status: revision.status,
        totalAmount,
        quoteItems: enrichedItems,
      },
    };
  }

  async updateQuoteRevision(quoteId: string, revisionId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const revisionResult = await quoteRevisionRepository.getById(revisionId, undefined, tx);

      if (!revisionResult.success || !revisionResult.data) {
        throw new Error("Quote revision not found");
      }

      if (revisionResult.data.quoteId !== quoteId) {
        throw new Error("Quote revision not found");
      }

      const quoteResult = await quoteRepository.getById(quoteId, undefined, tx);
      const isLatestRevision = quoteResult.data?.latestRevision === revisionResult.data.revision;

      const updatedRevisionResult = await quoteRevisionRepository.update(revisionId, data, tx);

      if (data.items) {
        const existingItems = await quoteItemRepository.getAll({
          filter: { quoteRevisionId: revisionId },
        });

        if (existingItems.success && existingItems.data) {
          await Promise.all(
            existingItems.data.map((item: QuoteItem) => quoteItemRepository.delete(item.id, tx)),
          );
        }

        if (data.items.length > 0) {
          await Promise.all(
            data.items.map((item: any) =>
              quoteItemRepository.create({
                ...item,
                quoteRevisionId: revisionId,
              }, tx),
            ),
          );
        }
      }

      if (data.terms) {
        const existingTerms = await quoteTermsRepository.getAll({
          filter: { quoteRevisionId: revisionId },
        });

        if (existingTerms.success && existingTerms.data) {
          await Promise.all(
            existingTerms.data.map((term: QuoteTerms) => quoteTermsRepository.delete(term.id, tx)),
          );
        }

        if (data.terms.length > 0) {
          await Promise.all(
            data.terms.map((term: any) =>
              quoteTermsRepository.create({
                ...term,
                quoteRevisionId: revisionId,
              }, tx),
            ),
          );
        }
      }

      if (isLatestRevision && updatedRevisionResult.success) {
        await quoteRepository.update(quoteId, {
          latestRevisionStatus: updatedRevisionResult.data.status,
          latestRevisionTotalAmount: updatedRevisionResult.data.totalAmount,
        }, tx);
      }

      return updatedRevisionResult;
    });
  }

  async deleteQuoteRevision(quoteId: string, revisionId: string) {
    return await prisma.$transaction(async (tx) => {
      const revisionResult = await quoteRevisionRepository.getById(revisionId, undefined, tx);

      if (!revisionResult.success || !revisionResult.data) {
        throw new Error("Quote revision not found");
      }

      if (revisionResult.data.quoteId !== quoteId) {
        throw new Error("Quote revision not found");
      }

      const [itemsResult, termsResult] = await Promise.all([
        quoteItemRepository.getAll({ filter: { quoteRevisionId: revisionId } }),
        quoteTermsRepository.getAll({ filter: { quoteRevisionId: revisionId } }),
      ]);

      if (itemsResult.success && itemsResult.data) {
        await Promise.all(
          itemsResult.data.map((item: QuoteItem) => quoteItemRepository.delete(item.id, tx)),
        );
      }

      if (termsResult.success && termsResult.data) {
        await Promise.all(
          termsResult.data.map((term: QuoteTerms) => quoteTermsRepository.delete(term.id, tx)),
        );
      }

      const result = await quoteRevisionRepository.delete(revisionId, tx);
      return result;
    });
  }

  async approveQuote(id: string) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await this.getQuoteWithDetails(id);
      if (!quoteResult.success || !quoteResult.data.latestRevision) {
        throw new Error("Quote or latest revision not found");
      }

      const result = await quoteRevisionRepository.update(quoteResult.data.latestRevision.id, {
        status: "APPROVED",
      }, tx);

      if (result.success) {
        await quoteRepository.update(id, {
          latestRevisionStatus: "APPROVED",
        }, tx);
      }

      return result;
    });
  }

  async acceptQuote(id: string) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await this.getQuoteWithDetails(id);
      if (!quoteResult.success || !quoteResult.data.latestRevision) {
        throw new Error("Quote or latest revision not found");
      }

      const result = await quoteRevisionRepository.update(quoteResult.data.latestRevision.id, {
        status: "ACCEPTED",
      }, tx);

      if (result.success) {
        await quoteRepository.update(id, {
          latestRevisionStatus: "ACCEPTED",
        }, tx);
      }

      return result;
    });
  }

  async rejectQuote(id: string) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await this.getQuoteWithDetails(id);
      if (!quoteResult.success || !quoteResult.data.latestRevision) {
        throw new Error("Quote or latest revision not found");
      }

      const result = await quoteRevisionRepository.update(quoteResult.data.latestRevision.id, {
        status: "REJECTED",
      }, tx);

      if (result.success) {
        await quoteRepository.update(id, {
          latestRevisionStatus: "REJECTED",
        }, tx);
      }

      return result;
    });
  }

  async sendQuote(id: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await this.getQuoteWithDetails(id);
      if (!quoteResult.success || !quoteResult.data.latestRevision) {
        throw new Error("Quote or latest revision not found");
      }

      const result = await quoteRevisionRepository.update(quoteResult.data.latestRevision.id, {
        status: "SENT",
        sentById: data.sentById,
      }, tx);

      if (result.success) {
        await quoteRepository.update(id, {
          latestRevisionStatus: "SENT",
        }, tx);
      }

      return result;
    });
  }

  async exportQuotePDF(id: string): Promise<Buffer> {
    const quoteResult = await this.getQuoteWithDetails(id);
    if (!quoteResult.success || !quoteResult.data.latestRevision) {
      throw new Error("Quote or latest revision not found");
    }

    const quote = quoteResult.data;
    const revision = quote.latestRevision;

    const pdfContent = {
      quoteNumber: `${quote.year}-${quote.number}`,
      revision: revision.revision,
      status: revision.status,
      quoteDate: revision.quoteDate,
      totalAmount: revision.totalAmount,
      items: revision.items || [],
      terms: revision.terms || [],
    };

    return Buffer.from(JSON.stringify(pdfContent, null, 2));
  }

  async getNextQuoteNumber(isDraft: boolean = false): Promise<string> {
    const currentYear = new Date().getFullYear().toString();

    // Get ALL quotes for the current year (including drafts) to find the highest number
    const quotesResult = await quoteRepository.getAll({
      filter: {
        year: currentYear,
      } as any,
      limit: 10000,
    });

    if (!quotesResult.success) {
      throw new Error("Failed to fetch quotes for number generation");
    }

    let nextNumber: string;

    if (!quotesResult.data?.length) {
      // No quotes exist for this year - start at 1
      nextNumber = "00001";
    }
    else {
      // Extract numeric parts and find the highest
      const numbers = quotesResult.data.map((q: any) => {
        let num = q.number.replace(/^DRAFT-/, "");

        // Handle old format: if number starts with year (e.g., "20250001"), extract just the sequence
        if (num.startsWith(currentYear)) {
          num = num.substring(currentYear.length);
        }

        return Number.parseInt(num) || 0;
      });
      const maxNumber = Math.max(...numbers);
      nextNumber = (maxNumber + 1).toString().padStart(5, "0");
    }

    return isDraft ? `DRAFT-${nextNumber}` : nextNumber;
  }

  async getNextQuoteRevision(quoteNumber: string, year?: number): Promise<string> {
    const currentYear = (year || new Date().getFullYear()).toString();

    const quoteResult = await quoteRepository.getAll({
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

    const revisionsResult = await quoteRevisionRepository.getAll({
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
    const quotesResult = await quoteRepository.getAll({
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
        const latestRevisionResult = await quoteRevisionRepository.getAll({
          filter: { quoteId: quote.id },
          sort: "revision",
          order: "desc",
          limit: 1,
        });

        const latestRevision = latestRevisionResult.data?.[0];
        if (latestRevision) {
          const itemsResult = await quoteItemRepository.getAll({
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

  async createQuoteItem(quoteId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const quoteResult = await quoteRepository.getById(quoteId, undefined, tx);

      if (!quoteResult.success || !quoteResult.data) {
        throw new Error("Quote not found");
      }

      const latestRevisionResult = await quoteRevisionRepository.getAll({
        filter: { quoteId },
        sort: "revision",
        order: "desc",
        limit: 1,
      });

      const latestRevision = latestRevisionResult.data?.[0];
      if (!latestRevision) {
        throw new Error("No revisions found for quote");
      }

      const existingItemsResult = await quoteItemRepository.getAll({
        filter: { quoteRevisionId: latestRevision.id },
      });

      const maxLineNumber = existingItemsResult.data?.reduce(
        (max: number, item: QuoteItem) => Math.max(max, item.lineNumber),
        0,
      ) || 0;

      const itemResult = await quoteItemRepository.create({
        ...data,
        quoteRevisionId: latestRevision.id,
        lineNumber: maxLineNumber + 1,
      }, tx);

      return itemResult;
    });
  }

  async updateQuoteItem(itemId: string, data: any) {
    return await quoteItemRepository.update(itemId, data);
  }

  async updateQuoteItemLineNumber(itemId: string, newLineNumber: number) {
    return await prisma.$transaction(async (tx) => {
      const itemResult = await quoteItemRepository.getById(itemId, undefined, tx);
      if (!itemResult.success || !itemResult.data) {
        throw new Error("Quote item not found");
      }

      const item = itemResult.data;
      const oldLineNumber = item.lineNumber;

      const allItemsResult = await quoteItemRepository.getAll({
        filter: { quoteRevisionId: item.quoteRevisionId },
      });

      if (!allItemsResult.success || !allItemsResult.data) {
        throw new Error("Failed to fetch items");
      }

      const sortedItems = allItemsResult.data
        .filter((i: QuoteItem) => i.id !== itemId)
        .sort((a: QuoteItem, b: QuoteItem) => a.lineNumber - b.lineNumber);

      const updatedItems: Array<{ id: string; lineNumber: number }> = [];

      if (newLineNumber > oldLineNumber) {
        for (const otherItem of sortedItems) {
          if (otherItem.lineNumber > oldLineNumber && otherItem.lineNumber <= newLineNumber) {
            updatedItems.push({
              id: otherItem.id,
              lineNumber: otherItem.lineNumber - 1,
            });
          }
        }
      }
      else if (newLineNumber < oldLineNumber) {
        for (const otherItem of sortedItems) {
          if (otherItem.lineNumber >= newLineNumber && otherItem.lineNumber < oldLineNumber) {
            updatedItems.push({
              id: otherItem.id,
              lineNumber: otherItem.lineNumber + 1,
            });
          }
        }
      }

      for (const update of updatedItems) {
        await quoteItemRepository.update(update.id, { lineNumber: update.lineNumber }, tx);
      }

      const result = await quoteItemRepository.update(itemId, { lineNumber: newLineNumber }, tx);

      return result;
    });
  }

  async deleteQuoteItem(itemId: string) {
    return await quoteItemRepository.delete(itemId);
  }
}
