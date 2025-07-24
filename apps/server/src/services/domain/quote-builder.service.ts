import { BadRequestError } from "@/middleware/error.middleware";
import {
  Company,
  Journey,
  JourneyStatus,
  Quote,
  QuoteItem,
  QuoteStatus,
} from "@prisma/client";
import { prisma } from "@/utils/prisma";
import {
  companyService,
  configurationService,
  itemService,
  journeyService,
  quoteItemService,
  quoteService,
} from "../repository";
import { Decimal } from "@prisma/client/runtime/library";
import { getEmployeeContext } from "@/utils/context";

export class QuoteBuilderService {
  async buildQuote(data: any) {
    const { companyId, journeyId, companyName, journeyName } = data;
    // TODO: add this to cache to avoid conflicts
    await this.validateCreateQuoteInput(data);
    const quoteNumber = await this.generateQuoteNumber();
    const quoteRevision = await this.generateRevisionNumber({
      year: quoteNumber.year,
      number: quoteNumber.number,
    });

    return await prisma.$transaction(async (tx) => {
      const company = await this.resolveCompany(companyId, companyName, tx);
      const journey = await this.resolveJourney(
        journeyId,
        journeyName,
        company,
        tx
      );

      const createData: any = {
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: quoteRevision,
        status: QuoteStatus.DRAFT,
      };
      if (company?.id) {
        createData.company = { connect: { id: company.id } };
      }
      if (journey?.id) {
        createData.journey = { connect: { id: journey.id } };
      }

      const quote = await quoteService.create(createData);

      if (!quote.success || !quote.data) {
        throw new BadRequestError("Failed to create quote");
      }

      return {
        success: true,
        data: {
          quote: quote.data,
          journey: journey,
          company: company,
        },
      };
    });
  }

  async getOverview(quoteId: string) {
    const quote = await quoteService.getById(quoteId);
    const quoteItems = await quoteItemService.getAll({
      filter: {
        quoteId: quoteId,
      },
    });

    return {
      success: true,
      data: {
        quote: quote.data,
        quoteItems: quoteItems.data,
      },
    };
  }

  async generateQuoteNumber(
    isDraft: boolean = true
  ): Promise<{ year: number; number: string }> {
    const currentYear = new Date().getFullYear();

    if (isDraft) {
      const lastDraft = await prisma.quote.findFirst({
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
        number: `DRAFT-${nextSequence.toString().padStart(5, "0")}`,
      };
    } else {
      const lastFinal = await prisma.quote.findFirst({
        where: {
          year: currentYear,
          AND: [
            { number: { not: { contains: "DRAFT" } } },
            { number: { not: { contains: "REV" } } },
          ],
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
          .padStart(5, "0")}`,
      };
    }
  }

  async attachCustomer(quoteId: string, companyId: string) {
    const quote = await quoteService.getById(quoteId);
  }

  async attachDealer(quoteId: string, dealerId: string) {}

  async addItem(
    quoteId: string,
    itemType: string,
    itemId: string,
    quantity: number = 1
  ) {
    const currentItems = await quoteItemService.getAll({
      filter: {
        quoteId: quoteId,
      },
    });
    const item =
      itemType === "item"
        ? await itemService.getById(itemId)
        : await configurationService.getById(itemId);

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
    const unitPrice =
      itemType === "item"
        ? ((item.data as any)?.unitPrice ?? 0)
        : ((item.data as any)?.price ?? 0);
    const unitPriceDecimal = new Decimal(unitPrice);
    const totalPrice = unitPriceDecimal.mul(quantity);

    const newQuoteItem = await quoteItemService.create({
      quoteId: quoteId,
      configurationId: itemType === "configuration" ? itemId : undefined,
      itemId: itemType === "item" ? itemId : undefined,
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

  async removeItem(quoteItemId: string) {
    const quoteItem = await quoteItemService.getById(quoteItemId);

    const quoteId = quoteItem.data?.quoteId;
    const currentItems = await quoteItemService.getAll({
      filter: {
        quoteId: quoteId,
      },
    });

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

  async updateItem(quoteItemId: string) {}

  async getQuoteWithItems(quoteId: string) {}

  async editQuote(quoteId: string) {}

  async createRevision(quoteId: string) {}

  async generateRevisionNumber({
    year,
    number,
  }: {
    year: number;
    number: string;
  }): Promise<string> {
    const lastRevision = await prisma.quote.findFirst({
      where: {
        year,
        number,
      },
      orderBy: { revision: "desc" },
    });

    if (!lastRevision || !lastRevision.revision) {
      return "A";
    }

    const currentRevision = lastRevision.revision;

    if (currentRevision.length === 1) {
      const nextChar = String.fromCharCode(currentRevision.charCodeAt(0) + 1);
      if (nextChar <= "Z") {
        return nextChar;
      }
      return "AA";
    }

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

  async getRevisions(quoteId: string) {}

  async getLatestRevision(quoteId: string) {}

  async approve(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (quote.data?.status !== QuoteStatus.DRAFT) {
      throw new BadRequestError("Quote is not draft");
    }

    if (!quote.data.journeyId) {
      throw new BadRequestError("Quote has no journey");
    }

    const quoteItems = await quoteItemService.getAll({
      filter: {
        quoteId: quoteId,
      },
    });

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

    const { year, number } = await this.generateQuoteNumber(false);

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

  async send(quoteId: string) {
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

  async downloadQuote(quoteId: string) {}

  async validateCreateQuoteInput(data: any) {
    const { companyId, companyName, journeyId, journeyName } = data;

    if (companyId && companyName) {
      throw new BadRequestError(
        "Only one of company ID or company name is required"
      );
    }

    if (journeyId && journeyName) {
      throw new BadRequestError(
        "Only one of journey ID or journey name is required"
      );
    }

    if (companyName && journeyId) {
      throw new BadRequestError(
        "Company name and journey ID cannot be provided together"
      );
    }
  }

  async updateItemLineNumber(quoteItemId: string, lineNumber: number) {
    return await prisma.$transaction(async (tx) => {
      const quoteItem = await quoteItemService.getById(quoteItemId, tx);

      if (!quoteItem.data) {
        throw new BadRequestError("Quote item not found");
      }

      if (lineNumber < 1) {
        throw new BadRequestError("Line number must be at least 1");
      }

      const quoteItems = await quoteItemService.getAll({
        filter: {
          quoteId: quoteItem.data.quoteId,
        },
      });

      if (!quoteItems.success || !quoteItems.data) {
        throw new BadRequestError("Failed to retrieve quote items");
      }

      const allItems = (
        quoteItems.data as (QuoteItem & { item?: any; configuration?: any })[]
      ).filter((item) => item.id !== quoteItemId);
      const totalItems = allItems.length + 1;

      if (lineNumber > totalItems) {
        lineNumber = totalItems;
      }

      const updatedQuoteItem = await quoteItemService.update(
        quoteItemId,
        {
          lineNumber,
        },
        tx
      );

      if (!updatedQuoteItem.success || !updatedQuoteItem.data) {
        throw new BadRequestError("Failed to update quote item");
      }

      const oldLineNumber = quoteItem.data.lineNumber;
      const newLineNumber = lineNumber;

      const itemsToReorder = allItems.map((item) => ({
        ...item,
        targetLineNumber: item.lineNumber,
      }));

      if (newLineNumber > oldLineNumber) {
        for (const item of itemsToReorder) {
          if (
            item.lineNumber > oldLineNumber &&
            item.lineNumber <= newLineNumber
          ) {
            item.targetLineNumber = item.lineNumber - 1;
          }
        }
      } else if (newLineNumber < oldLineNumber) {
        for (const item of itemsToReorder) {
          if (
            item.lineNumber >= newLineNumber &&
            item.lineNumber < oldLineNumber
          ) {
            item.targetLineNumber = item.lineNumber + 1;
          }
        }
      }

      for (const item of itemsToReorder) {
        if (item.targetLineNumber !== item.lineNumber) {
          await quoteItemService.update(
            item.id,
            {
              lineNumber: item.targetLineNumber,
            },
            tx
          );
        }
      }

      return {
        success: true,
        data: updatedQuoteItem.data,
      };
    });
  }

  private async resolveCompany(
    companyId?: string,
    companyName?: string,
    tx?: any
  ) {
    const throwError = true;
    let company: Company | undefined;
    if (companyId) {
      const c = await companyService.getById(
        companyId,
        tx,
        undefined,
        throwError
      );
      company = c.data;
    } else if (companyName) {
      const c = await companyService.create({
        name: companyName,
      });
      if (!c.success || !c.data) {
        throw new BadRequestError("Failed to create company");
      }
      company = c.data;
    }
    return company;
  }

  private async resolveJourney(
    journeyId?: string,
    journeyName?: string,
    company?: Company,
    tx?: any
  ) {
    const throwError = true;
    let journey: Journey | undefined;
    if (journeyId) {
      const j = await journeyService.getById(
        journeyId,
        tx,
        undefined,
        throwError
      );
      journey = j.data;
    } else if (journeyName && company) {
      const j = await journeyService.create({
        company: { connect: { id: company.id } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
      });
      if (!j.success || !j.data) {
        throw new BadRequestError("Failed to create journey");
      }
      journey = j.data;
    }
    return journey;
  }
}
