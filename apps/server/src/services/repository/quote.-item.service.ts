import { Prisma, QuoteItem } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { quoteService } from "..";

type QuoteItemAttributes = Omit<QuoteItem, "id" | "createdAt" | "updatedAt">;

export class QuoteItemService extends BaseService<QuoteItem> {
  protected model = prisma.quoteItem;
  protected entityName = "QuoteItem";
  protected modelName = "quoteItem";

  public async getByQuoteId(quoteId: string, tx?: Prisma.TransactionClient) {
    const model = tx ? (tx as any)[this.entityName.toLowerCase()] : this.model;
    const quoteItems = await model.findMany({
      where: { quoteId },
      include: {
        item: true,
        configuration: true,
      },
    });

    if (!quoteItems) {
      return {
        success: false,
        data: null,
        message: "No quote items found",
      };
    }

    return { success: true, data: quoteItems };
  }

  protected async validate(quoteItem: QuoteItemAttributes): Promise<void> {
    if (!quoteItem.quoteId) {
      throw new BadRequestError("Quote ID is required");
    }

    const quote = await quoteService.getById(quoteItem.quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (!quoteItem.configurationId && !quoteItem.itemId) {
      throw new BadRequestError("Either configurationId or itemId is required");
    }

    if (quoteItem.configurationId && quoteItem.itemId) {
      throw new BadRequestError(
        "Only one of configurationId or itemId is allowed"
      );
    }
  }
}
