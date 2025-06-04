import { CompanyStatus, Quote, QuoteStatus } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { getEmployeeContext } from "@/utils/context";
import { companyService, journeyService } from "..";

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";

  public async createQuote(data: any) {
    const employee = getEmployeeContext();
    const quoteNumber = await this.generateQuoteNumber(true);

    if (data.customerId && data.journeyId) {
      // create quote & attach to journey
      const quote = await this.create({
        journeyId: data.journeyId,
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
    } else if (data.customerId && data.journeyName) {
      // create journey & attach to company
      const journey = await journeyService.create({
        customer: { connect: { id: data.customerId } },
        createdBy: { connect: { id: employee.id } },
        name: data.journeyName,
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
    } else if (data.customerName && data.journeyName) {
      // create customer -> then create journey & attach to customer -> then create quote & attach to journey
      const company = await companyService.create({
        name: data.customerName,
        status: CompanyStatus.SANDBOX,
      });

      if (!company.success || !company.data) {
        throw new BadRequestError("Failed to create company");
      }

      const journey = await journeyService.create({
        customer: { connect: { id: data.customerId } },
        createdBy: { connect: { id: employee.id } },
        name: data.journeyName,
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }
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

  public async approveQuote(quoteId: string) {}

  public async createRevision(quoteId: string) {}

  protected async validate(quote: QuoteAttributes): Promise<void> {
    if (quote.journeyId) {
      const journey = await prisma.journey.findUnique({
        where: { id: quote.journeyId },
      });

      if (!journey) {
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
