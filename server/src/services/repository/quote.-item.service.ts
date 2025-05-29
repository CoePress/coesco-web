import { QuoteItem } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteItemAttributes = Omit<QuoteItem, "id" | "createdAt" | "updatedAt">;

export class QuoteItemService extends BaseService<QuoteItem> {
  protected model = prisma.quoteItem;
  protected entityName = "QuoteItem";

  protected async validate(quoteItem: QuoteItemAttributes): Promise<void> {
    if (!quoteItem.quoteRevisionId) {
      throw new BadRequestError("Quote revision ID is required");
    }
  }
}
