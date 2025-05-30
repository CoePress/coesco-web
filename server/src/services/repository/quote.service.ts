import { Quote } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

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
