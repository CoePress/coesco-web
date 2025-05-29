import { QuoteRevision } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteRevisionAttributes = Omit<
  QuoteRevision,
  "id" | "createdAt" | "updatedAt"
>;

export class QuoteRevisionService extends BaseService<QuoteRevision> {
  protected model = prisma.quoteRevision;
  protected entityName = "QuoteRevision";

  protected async validate(
    quoteRevision: QuoteRevisionAttributes
  ): Promise<void> {
    if (!quoteRevision.quoteId) {
      throw new BadRequestError("Quote ID is required");
    }
  }
}
