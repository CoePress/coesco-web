import { BadRequestError } from "@/middleware/error.middleware";
import { companyService, journeyService, quoteService } from "..";
import { Company, Journey, JourneyStatus } from "@prisma/client";
import { prisma } from "@/utils/prisma";

export class QuoteBuilderService {
  async createQuote(data: any) {
    const { companyId, journeyId, companyName, journeyName } = data;
    // TODO: add this to cache to avoid conflicts
    await this.validateCreateQuoteInput(data);
    const quoteNumber = await this.generateQuoteNumber();

    await prisma.$transaction(async (tx) => {
      const company = await this.resolveCompany(companyId, companyName, tx);
      const journey = await this.resolveJourney(
        journeyId,
        journeyName,
        company,
        tx
      );

      const quote = await quoteService.create({
        company: { connect: { id: company?.id } },
        journey: { connect: { id: journey?.id } },
        year: quoteNumber.year,
        number: quoteNumber.number,
      });

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

  async generateQuoteNumber() {}

  async attachCustomer(quoteId: string, companyId: string) {
    const quote = await quoteService.getById(quoteId);
  }

  async attachDealer(quoteId: string, dealerId: string) {}

  async addItem(quoteId: string, itemId: string, quantity: number) {}

  async removeItem(quoteItemId: string) {}

  async updateItem(quoteItemId: string) {}

  async getQuoteWithItems(quoteId: string) {}

  async editQuote(quoteId: string) {}

  async createRevision(quoteId: string) {}

  async generateRevisionNumber(quoteId: string) {}

  async getRevisions(quoteId: string) {}

  async getLatestRevision(quoteId: string) {}

  async approveQuote(quoteId: string) {}

  async sendQuote(quoteId: string) {}

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
    let journey: Journey | undefined;
    if (journeyId) {
      const j = await journeyService.getById(journeyId, tx, undefined, true);
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
  }
}
