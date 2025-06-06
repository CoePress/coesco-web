import { Quote, QuoteStatus } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { journeyService, quoteItemService } from "..";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  async getLatestRevision(quoteNumber: string) {
    const quote = await this.model.findFirst({
      where: { number: quoteNumber },
      orderBy: { revision: "desc" },
    });

    return quote;
  }

  async getQuoteWithTotal(quoteId: string) {
    const quote = await this.model.findUnique({
      where: { id: quoteId },
      include: {
        items: true,
      },
    });

    if (!quote) {
      throw new BadRequestError("Quote not found");
    }

    const total = quote.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

    return { ...quote, total };
  }

  async removeItemFromQuote(quoteItemId: string, quantity: number = 1) {
    const quoteItem = await quoteItemService.getById(quoteItemId);

    // if remaining quantity is zero, remove entire record & update other line numbers
  }

  async sendQuote(quoteId: string) {
    const quote = await this.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (quote.data.status !== QuoteStatus.APPROVED) {
      throw new BadRequestError("Quote is not approved");
    }

    const updatedQuote = await this.update(quoteId, {
      status: QuoteStatus.SENT,
    });

    return {
      success: true,
      data: updatedQuote.data,
    };
  }

  async createQuoteRevision(quoteId: string) {
    const quote = await this.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (quote.data.status !== QuoteStatus.SENT) {
      throw new BadRequestError("Quote is not sent");
    }

    const quoteItems = await quoteItemService.getAll({
      filter: { quoteId },
    });

    if (!quoteItems.success || !quoteItems.data) {
      throw new BadRequestError("Failed to fetch quote items");
    }

    const newRevision = await this.generateRevisionNumber(quote.data);

    const newQuote = await this.create({
      journeyId: quote.data.journeyId,
      status: QuoteStatus.DRAFT,
      year: quote.data.year,
      number: quote.data.number,
      revision: newRevision,
      subtotal: quote.data.subtotal,
      totalAmount: quote.data.totalAmount,
      currency: quote.data.currency,
      createdById: quote.data.createdById,
    });

    if (!newQuote.success || !newQuote.data) {
      throw new BadRequestError("Failed to create quote revision");
    }

    // Copy all items from the original quote
    for (const item of quoteItems.data) {
      await quoteItemService.create({
        quoteId: newQuote.data.id,
        itemId: item.itemId,
        lineNumber: item.lineNumber,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      });
    }

    await this.update(quoteId, {
      status: QuoteStatus.REVISED,
    });

    return {
      success: true,
      data: newQuote.data,
    };
  }

  // Helper methods
  protected async validate(quote: QuoteAttributes): Promise<void> {
    if (quote.journeyId) {
      const journey = await journeyService.getById(quote.journeyId);

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Journey not found");
      }
    }

    if (!quote.year) {
      quote.year = new Date().getFullYear();
    }
  }

  async generateQuoteNumber(
    isDraft: boolean = true
  ): Promise<{ year: number; number: string }> {
    const currentYear = new Date().getFullYear();

    if (isDraft) {
      const lastDraft = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { contains: "DRAFT" },
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastDraft
        ? parseInt(lastDraft.number.split("-").pop() || "0") + 1
        : 1;

      return {
        year: currentYear,
        number: `DRAFT-${nextSequence.toString().padStart(5, "0")}`,
      };
    } else {
      const lastFinal = await this.model.findFirst({
        where: {
          year: currentYear,
          AND: [
            { number: { not: { contains: "DRAFT" } } },
            { number: { not: { contains: "REV" } } },
          ],
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastFinal
        ? parseInt(lastFinal.number.split("-").pop() || "0") + 1
        : 1;

      return {
        year: currentYear,
        number: `${currentYear.toString().slice(-2)}-${nextSequence
          .toString()
          .padStart(5, "0")}`,
      };
    }
  }

  async generateRevisionNumber(quote: Quote): Promise<string> {
    const lastRevision = await this.model.findFirst({
      where: {
        year: quote.year,
        number: quote.number,
      },
      orderBy: { revision: "desc" },
    });

    if (!lastRevision) {
      return "A";
    }

    const currentRevision = lastRevision.revision;

    // Handle single letter (A-Z)
    if (currentRevision.length === 1) {
      const nextChar = String.fromCharCode(currentRevision.charCodeAt(0) + 1);
      if (nextChar <= "Z") {
        return nextChar;
      }
      return "AA"; // Move to double letters after Z
    }

    // Handle double letters (AA-ZZ)
    if (currentRevision.length === 2) {
      const firstChar = currentRevision[0];
      const secondChar = currentRevision[1];

      if (secondChar < "Z") {
        return firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
      }

      if (firstChar < "Z") {
        return String.fromCharCode(firstChar.charCodeAt(0) + 1) + "A";
      }

      throw new BadRequestError("Maximum revision limit reached (ZZ)");
    }

    throw new BadRequestError("Invalid revision format");
  }
}
