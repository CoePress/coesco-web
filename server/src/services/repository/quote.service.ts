import { Quote } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  async generateQuoteNumber(
    isDraft: boolean = true
  ): Promise<{ year: number; number: string }> {
    const currentYear = new Date().getFullYear();

    if (isDraft) {
      // Get next draft sequence for current year
      const lastDraft = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { endsWith: "-D" },
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastDraft
        ? parseInt(lastDraft.number.replace("-D", "")) + 1
        : 1;

      return {
        year: currentYear,
        number: `${nextSequence.toString().padStart(4, "0")}-D`,
      };
    } else {
      // Get next final quote sequence (no -D suffix)
      const lastFinal = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { not: { endsWith: "-D" } },
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastFinal ? parseInt(lastFinal.number) + 1 : 1;

      return {
        year: currentYear,
        number: nextSequence.toString().padStart(4, "0"),
      };
    }
  }

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
