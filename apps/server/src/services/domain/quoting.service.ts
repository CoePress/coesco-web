import { BadRequestError } from "@/middleware/error.middleware";
import { QuoteStatus } from "@prisma/client";
import {
  companyService,
  configurationService,
  employeeService,
  journeyService,
  quoteItemService,
  quoteService,
} from "../repository";
import { prisma } from "@/utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class QuotingService {
  async updateUnitPrice(quoteItemId: string, unitPrice: number) {
    const quoteItem = await quoteItemService.getById(quoteItemId);
    const unitPriceDecimal = new Decimal(unitPrice);

    const updatedItem = await quoteItemService.update(quoteItemId, {
      unitPrice: unitPriceDecimal,
      totalPrice: unitPriceDecimal.mul(quoteItem.data?.quantity ?? 0),
    });

    return {
      success: true,
      data: updatedItem.data,
    };
  }

  async createQuoteRevision(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (quote.data?.status !== QuoteStatus.SENT) {
      throw new BadRequestError("Quote is not sent");
    }

    const quoteItems = await quoteItemService.getByQuoteId(quoteId);

    const newRevision = await quoteService.generateRevisionNumber(quote.data);

    const newQuote = await quoteService.create({
      journeyId: quote.data.journeyId,
      status: QuoteStatus.DRAFT,
      year: quote.data.year,
      number: quote.data.number,
      revision: newRevision,
      createdById: quote.data.createdById,
    });

    for (const item of quoteItems.data) {
      await quoteItemService.create({
        quoteId: newQuote.data?.id,
        itemId: item.itemId,
        lineNumber: item.lineNumber,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      });
    }

    await quoteService.update(quoteId, {
      status: QuoteStatus.REVISED,
    });

    return {
      success: true,
      data: newQuote.data,
    };
  }

  async getQuoteWithTotal(quoteId: string) {
    const quote = await quoteService.getById(quoteId);
    const quoteItems = await quoteItemService.getByQuoteId(quoteId);

    const total = quoteItems.data?.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
      0
    );

    return {
      ...quote.data,
      total,
    };
  }

  async getQuoteOverview(quoteId: string) {
    return await prisma.$transaction(async (tx) => {
      const quote = await quoteService.getById(quoteId, tx);
      const quoteItems = await quoteItemService.getByQuoteId(quoteId);

      let journey = null;
      let customer = null;
      let dealer = null;

      if (quote.data?.journeyId) {
        const journeyResult = await journeyService.getById(
          quote.data?.journeyId,
          tx
        );
        if (journeyResult.success && journeyResult.data) {
          journey = journeyResult.data;

          if (journey.customerId) {
            const customerResult = await companyService.getById(
              journey.customerId,
              tx
            );
            if (customerResult.success && customerResult.data) {
              customer = customerResult.data;
            }
          }

          if (journey.dealerId) {
            const dealerResult = await companyService.getById(
              journey.dealerId,
              tx
            );
            if (dealerResult.success && dealerResult.data) {
              dealer = dealerResult.data;
            }
          }
        }
      }

      let creator: any;
      if (quote.data?.createdById !== "system") {
        creator = await employeeService.getById(
          quote.data?.createdById ?? "",
          tx
        );
      } else {
        creator = {
          success: true,
          data: {
            id: "system",
            firstName: "System",
          },
        };
      }

      let approvedBy: any;
      if (quote.data?.approvedById) {
        approvedBy = await employeeService.getById(
          quote.data?.approvedById ?? "",
          tx
        );
      }

      return {
        success: true,
        data: {
          quote: {
            ...quote.data,
            createdBy: creator?.data,
            approvedBy: approvedBy?.data,
          },
          quoteItems: quoteItems.data,
          journey,
          customer,
          dealer,
        },
      };
    });
  }

  async addConfigurationToQuote(quoteId: string, configurationId: string) {
    const quote = await quoteService.getById(quoteId);
    const configuration = await configurationService.getById(configurationId);

    if (!quote.data || !configuration.data) {
      throw new BadRequestError("Quote or configuration not found");
    }

    const newQuoteItem = await quoteItemService.create({
      quoteId: quote.data.id,
      itemId: configuration.data.id,
      lineNumber: 1,
      unitPrice: 0,
      quantity: 1,
    });

    return {
      success: true,
      data: newQuoteItem.data,
    };
  }
}
