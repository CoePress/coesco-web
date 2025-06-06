import { BadRequestError } from "@/middleware/error.middleware";
import { getEmployeeContext } from "@/utils/context";
import { CompanyStatus, JourneyStatus, QuoteStatus } from "@prisma/client";
import {
  companyService,
  employeeService,
  itemService,
  journeyService,
  quoteItemService,
  quoteService,
} from "..";
import { prisma } from "@/utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class QuoteBuilderService {
  async buildQuote(data: any) {
    const { customerId, journeyId, customerName, journeyName } = data;

    const employee = getEmployeeContext();
    const quoteNumber = await quoteService.generateQuoteNumber(true);

    if (customerId && journeyId) {
      return await quoteService.create({
        journey: { connect: { id: journeyId } },
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        createdBy: { connect: { id: employee.id } },
      });
    } else if (customerId && journeyName) {
      const journey = await journeyService.create({
        customer: { connect: { id: customerId } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
        createdBy: { connect: { id: employee.id } },
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }

      const quote = await quoteService.create({
        journey: { connect: { id: journey.data.id } },
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        createdBy: { connect: { id: employee.id } },
      });

      if (!quote.success || !quote.data) {
        throw new BadRequestError("Failed to create quote");
      }

      return {
        success: true,
        data: {
          quote: quote.data,
          journey: journey.data,
        },
      };
    } else if (customerName && journeyName) {
      const company = await companyService.create({
        name: customerName,
        status: CompanyStatus.SANDBOX,
      });

      if (!company.success || !company.data) {
        throw new BadRequestError("Failed to create company");
      }

      const journey = await journeyService.create({
        customer: { connect: { id: company.data.id } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
        createdBy: { connect: { id: employee.id } },
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }

      const quote = await quoteService.create({
        journey: { connect: { id: journey.data.id } },
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        createdBy: { connect: { id: employee.id } },
      });

      if (!quote.success || !quote.data) {
        throw new BadRequestError("Failed to create quote");
      }

      return {
        success: true,
        data: {
          quote: quote.data,
          journey: journey.data,
          company: company.data,
        },
      };
    } else {
      return await quoteService.create({
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        createdBy: { connect: { id: employee.id } },
      });
    }
  }

  async addItemToQuote(quoteId: string, itemId: string, quantity: number = 1) {
    const currentItems = await quoteItemService.getByQuoteId(quoteId);
    const item = await itemService.getById(itemId);

    const existingItem = currentItems.data?.find(
      (i: any) => i.itemId === itemId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const unitPriceDecimal = new Decimal(existingItem.unitPrice);
      const newTotalPrice = unitPriceDecimal.mul(newQuantity);

      const updatedItem = await quoteItemService.update(existingItem.id, {
        quantity: newQuantity,
        totalPrice: newTotalPrice,
      });

      return {
        success: true,
        data: updatedItem.data,
      };
    }

    const lineNumber = (currentItems.data?.length || 0) + 1;
    const unitPrice = item.data?.unitPrice ?? 0;
    const unitPriceDecimal = new Decimal(unitPrice);
    const totalPrice = unitPriceDecimal.mul(quantity);

    const newQuoteItem = await quoteItemService.create({
      quoteId: quoteId,
      itemId: itemId,
      lineNumber,
      unitPrice: unitPriceDecimal,
      quantity,
      totalPrice,
    });

    return {
      success: true,
      data: newQuoteItem.data,
    };
  }

  async removeItemFromQuote(quoteItemId: string) {
    const quoteItem = await quoteItemService.getById(quoteItemId);

    const quoteId = quoteItem.data?.quoteId;
    const currentItems = await quoteItemService.getByQuoteId(quoteId ?? "");

    await quoteItemService.delete(quoteItemId);

    const remainingItems =
      currentItems.data?.filter((item: any) => item.id !== quoteItemId) || [];

    for (let i = 0; i < remainingItems.length; i++) {
      await quoteItemService.update(remainingItems[i].id, {
        lineNumber: i + 1,
      });
    }

    return {
      success: true,
      data: null,
    };
  }

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

  async approveQuote(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (quote.data?.status !== QuoteStatus.DRAFT) {
      throw new BadRequestError("Quote is not draft");
    }

    if (!quote.data.journeyId) {
      throw new BadRequestError("Quote has no journey");
    }

    const quoteItems = await quoteItemService.getByQuoteId(quoteId);

    if (quoteItems.data.length === 0) {
      throw new BadRequestError("Quote has no items");
    }

    const hasUnitPrice = quoteItems.data.some(
      (item: any) => item.unitPrice === null
    );

    const hasQuantity = quoteItems.data.some(
      (item: any) => item.quantity === null
    );

    if (hasUnitPrice || hasQuantity) {
      throw new BadRequestError("Quote items have no unit price or quantity");
    }

    const { year, number } = await quoteService.generateQuoteNumber(false);

    const employee = getEmployeeContext();

    const updatedQuote = await quoteService.update(quoteId, {
      status: QuoteStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: employee.id,
      year,
      number,
    });

    return {
      success: true,
      data: updatedQuote.data,
    };
  }

  async sendQuote(quoteId: string) {
    // TODO: send email to customer
    const quote = await quoteService.getById(quoteId);

    if (quote.data?.status !== QuoteStatus.APPROVED) {
      throw new BadRequestError("Quote is not approved");
    }

    const updatedQuote = await quoteService.update(quoteId, {
      status: QuoteStatus.SENT,
    });

    return {
      success: true,
      data: updatedQuote.data,
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
}
