import { Quote } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  public async generateQuoteNumber(
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
        number: `${currentYear.toString().slice(-2)}-DRAFT-${nextSequence
          .toString()
          .padStart(4, "0")}`,
      };
    } else {
      const lastFinal = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { not: { contains: "DRAFT" } },
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
          .padStart(4, "0")}`,
      };
    }
  }

  public async approveQuote(quoteId: string) {}

  public async createRevision(quoteId: string) {}

  protected async validate(quote: QuoteAttributes): Promise<void> {
    if (!quote.journeyId) {
      throw new BadRequestError("Journey ID is required");
    }

    const journey = await prisma.journey.findUnique({
      where: { id: quote.journeyId },
    });

    if (!journey) {
      throw new BadRequestError("Journey not found");
    }

    if (!quote.year) {
      quote.year = new Date().getFullYear();
    }

    if (!quote.number) {
      quote.number = "0000000000";
    }
  }
}
