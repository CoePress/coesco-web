import {
  CompanyStatus,
  JourneyStatus,
  Quote,
  QuoteStatus,
} from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { getEmployeeContext } from "@/utils/context";
import {
  companyService,
  itemService,
  journeyService,
  quoteItemService,
} from "..";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  public async createQuote(data: any) {
    const employee = getEmployeeContext();
    const quoteNumber = await this.generateQuoteNumber(true);

    const { customerId, journeyId, customerName, journeyName } = data;

    if (customerId && journeyId) {
      // create quote & attach to journey
      const quote = await this.create({
        journeyId: journeyId,
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
      });

      if (!quote.success || !quote.data) {
        throw new BadRequestError("Failed to create quote");
      }

      return {
        success: true,
        data: quote.data,
      };
    } else if (customerId && journeyName) {
      // create journey & attach to company
      const journey = await journeyService.create({
        customer: { connect: { id: customerId } },
        createdBy: { connect: { id: employee.id } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }

      const quote = await this.create({
        journeyId: journey.data.id,
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
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
      // create customer -> then create journey & attach to customer -> then create quote & attach to journey
      const company = await companyService.create({
        name: customerName,
        status: CompanyStatus.SANDBOX,
      });

      if (!company.success || !company.data) {
        throw new BadRequestError("Failed to create company");
      }

      const journey = await journeyService.create({
        customer: { connect: { id: company.data.id } },
        createdBy: { connect: { id: employee.id } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }

      const quote = await this.create({
        journeyId: journey.data.id,
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
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
      // create standalone quote
      const quote = await this.create({
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
      });

      if (!quote.success || !quote.data) {
        throw new BadRequestError("Failed to create quote");
      }

      return {
        success: true,
        data: quote.data,
      };
    }
  }

  public async generateQuoteNumber(
    isDraft: boolean = true
  ): Promise<{ year: number; number: string }> {
    const currentYear = new Date().getFullYear();

    if (isDraft) {
      const lastDraft = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { contains: "DRAFT" },
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastDraft
        ? parseInt(lastDraft.number.split("-").pop() || "0") + 1
        : 1;

      return {
        year: currentYear,
        number: `${currentYear.toString().slice(-2)}-DRAFT-${nextSequence
          .toString()
          .padStart(4, "0")}`,
      };
    } else {
      const lastFinal = await this.model.findFirst({
        where: {
          year: currentYear,
          number: { not: { contains: "DRAFT" } },
        },
        orderBy: { number: "desc" },
      });

      const nextSequence = lastFinal
        ? parseInt(lastFinal.number.split("-").pop() || "0") + 1
        : 1;

      return {
        year: currentYear,
        number: `${currentYear.toString().slice(-2)}-${nextSequence
          .toString()
          .padStart(4, "0")}`,
      };
    }
  }

  public async addItemToQuote(
    quoteId: string,
    itemId: string,
    quantity: number = 1
  ) {
    const quote = await this.model.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new BadRequestError("Quote not found");
    }

    const item = await itemService.getById(itemId);

    if (!item.success || !item.data) {
      throw new BadRequestError("Item not found");
    }

    // Get current quote items to determine next line number
    const currentItems = await quoteItemService.getAll({
      filter: { quoteId },
    });

    const lineNumber = (currentItems.data?.length || 0) + 1;
    const unitPrice = item.data.unitPrice;
    const totalPrice = unitPrice * quantity;

    const newQuoteItem = await quoteItemService.create({
      quoteId: quoteId,
      itemId: itemId,
      lineNumber,
      unitPrice,
      quantity,
      totalPrice,
    });

    return {
      success: true,
      data: newQuoteItem.data,
    };
  }

  public async approveQuote(quoteId: string) {
    // TODO: update quote number from draft number
    const quote = await this.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (quote.data.status !== QuoteStatus.DRAFT) {
      throw new BadRequestError("Quote is not draft");
    }

    if (!quote.data.journeyId) {
      throw new BadRequestError("Quote has no journey");
    }

    const quoteItems = await quoteItemService.getAll({
      filter: { quoteId },
    });

    if (!quoteItems.success || !quoteItems.data) {
      throw new BadRequestError("Quote items not found");
    }

    if (quoteItems.data.length === 0) {
      throw new BadRequestError("Quote has no items");
    }

    // check if quote items have a unit price
    const hasUnitPrice = quoteItems.data.some(
      (item) => item.unitPrice === null
    );

    const hasQuantity = quoteItems.data.some((item) => item.quantity === null);

    if (hasUnitPrice || hasQuantity) {
      throw new BadRequestError("Quote items have no unit price or quantity");
    }

    const employee = getEmployeeContext();

    const updatedQuote = await this.update(quoteId, {
      status: QuoteStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: employee.id,
    });

    return {
      success: true,
      data: updatedQuote.data,
    };
  }

  public async sendQuote(quoteId: string) {
    const quote = await this.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (quote.data.status !== QuoteStatus.APPROVED) {
      throw new BadRequestError("Quote is not approved");
    }

    const updatedQuote = await this.update(quoteId, {
      status: QuoteStatus.SENT,
    });

    return {
      success: true,
      data: updatedQuote.data,
    };
  }

  public async createQuoteRevision(quoteId: string) {
    const quote = await this.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not found");
    }

    if (quote.data.status !== QuoteStatus.SENT) {
      throw new BadRequestError("Quote is not sent");
    }

    const quoteItems = await quoteItemService.getAll({
      filter: { quoteId },
    });

    if (!quoteItems.success || !quoteItems.data) {
      throw new BadRequestError("Failed to fetch quote items");
    }

    const newRevision = await this.generateRevisionNumber(quote.data);

    const newQuote = await this.create({
      journeyId: quote.data.journeyId,
      status: QuoteStatus.DRAFT,
      year: quote.data.year,
      number: quote.data.number,
      revision: newRevision,
      subtotal: quote.data.subtotal,
      totalAmount: quote.data.totalAmount,
      currency: quote.data.currency,
      createdById: quote.data.createdById,
    });

    if (!newQuote.success || !newQuote.data) {
      throw new BadRequestError("Failed to create quote revision");
    }

    // Copy all items from the original quote
    for (const item of quoteItems.data) {
      await quoteItemService.create({
        quoteId: newQuote.data.id,
        itemId: item.itemId,
        lineNumber: item.lineNumber,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      });
    }

    await this.update(quoteId, {
      status: QuoteStatus.REVISED,
    });

    return {
      success: true,
      data: newQuote.data,
    };
  }

  protected async generateRevisionNumber(quote: Quote): Promise<string> {
    const lastRevision = await this.model.findFirst({
      where: {
        year: quote.year,
        number: quote.number,
      },
      orderBy: { revision: "desc" },
    });

    if (!lastRevision) {
      return "A";
    }

    const currentRevision = lastRevision.revision;

    // Handle single letter (A-Z)
    if (currentRevision.length === 1) {
      const nextChar = String.fromCharCode(currentRevision.charCodeAt(0) + 1);
      if (nextChar <= "Z") {
        return nextChar;
      }
      return "AA"; // Move to double letters after Z
    }

    // Handle double letters (AA-ZZ)
    if (currentRevision.length === 2) {
      const firstChar = currentRevision[0];
      const secondChar = currentRevision[1];

      if (secondChar < "Z") {
        return firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
      }

      if (firstChar < "Z") {
        return String.fromCharCode(firstChar.charCodeAt(0) + 1) + "A";
      }

      throw new BadRequestError("Maximum revision limit reached (ZZ)");
    }

    throw new BadRequestError("Invalid revision format");
  }

  protected async validate(quote: QuoteAttributes): Promise<void> {
    if (quote.journeyId) {
      const journey = await journeyService.getById(quote.journeyId);

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Journey not found");
      }
    }

    if (!quote.year) {
      quote.year = new Date().getFullYear();
    }

    if (!quote.number) {
      quote.number = "0000000000";
    }
  }
}
