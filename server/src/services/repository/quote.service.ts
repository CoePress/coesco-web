import { Quote } from "@prisma/client";
import { BaseService } from "./index";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  protected async validate(quote: QuoteAttributes): Promise<void> {
    if (!quote.customerId) {
      throw new BadRequestError("Customer ID is required");
    }
  }
}
