import { QuoteItem } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { quoteService } from '.';
import { configurationService } from '.';
import { itemService } from '.';

type QuoteItemAttributes = Omit<QuoteItem, "id" | "createdAt" | "updatedAt">;

export class QuoteItemService extends BaseService<QuoteItem> {
  protected model = prisma.quoteItem;
  protected entityName = "QuoteItem";
  protected modelName = "quoteItem";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: QuoteItemAttributes): Promise<void> {
    if (!data.quoteId) {
      throw new BadRequestError("quoteId is required");
    }

    const quote = await quoteService.getById(data.quoteId);
    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (!data.quantity) {
      throw new BadRequestError("quantity is required");
    }

    if (!data.unitPrice) {
      throw new BadRequestError("unitPrice is required");
    }

    if (!data.totalPrice) {
      throw new BadRequestError("totalPrice is required");
    }

    if (!data.lineNumber) {
      throw new BadRequestError("lineNumber is required");
    }
  }
}
