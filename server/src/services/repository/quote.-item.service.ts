import { QuoteItem } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type QuoteItemAttributes = Omit<QuoteItem, "id" | "createdAt" | "updatedAt">;

export class QuoteItemService extends BaseService<QuoteItem> {
  protected model = prisma.quoteItem;
  protected entityName = "QuoteItem";

  protected async validate(quoteItem: QuoteItemAttributes): Promise<void> {
    if (!quoteItem.quoteId) {
      throw new BadRequestError("Quote ID is required");
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteItem.quoteId },
    });

    if (!quote) {
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
