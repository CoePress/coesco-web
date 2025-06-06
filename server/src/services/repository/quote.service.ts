import { Quote } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { journeyService } from "..";

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
}
