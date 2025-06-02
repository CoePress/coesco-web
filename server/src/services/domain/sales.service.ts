import { prisma } from "@/utils/prisma";
import {
  quoteService,
  quoteItemService,
  journeyService,
  companyService,
} from "..";

export class SalesService {
  async createSandboxQuote(user: any, employee: any) {
    // sandbox company
    const company = await prisma.company.create({
      data: {
        name: "Sandbox Company",
        status: "STAGING",
      },
    });

    // sandbox journey
    const journey = await prisma.journey.create({
      data: {
        customer: {
          connect: {
            id: company.id,
          },
        },
        createdBy: {
          connect: {
            id: employee.id,
          },
        },
        priority: "LOW",
        confidence: 1,
      },
    });

    // sandbox quote
    const quote = await prisma.quote.create({
      data: {
        journeyId: journey.id,
        status: "DRAFT",
        year: new Date().getFullYear(),
        number: "0",
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
      },
    });

    return {
      company,
      journey,
      quote,
    };
  }

  async createCustomerQuote(user: any, customerId: string) {}

  async createRevision(user: any, quoteId: string) {}

  async getQuoteOverview(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new Error("Quote not found");
    }

    const journey = await journeyService.getById(quote.data.journeyId);

    if (!journey.success || !journey.data) {
      throw new Error("Journey not found");
    }

    if (journey.data.customerId) {
      const customer = await companyService.getById(journey.data.customerId);

      if (!customer.success || !customer.data) {
        throw new Error("Customer not found");
      }
    }

    if (journey.data.dealerId) {
      const dealer = await companyService.getById(journey.data.dealerId);

      if (!dealer.success || !dealer.data) {
        throw new Error("Dealer not found");
      }
    }

    const items = await quoteItemService.getAll({
      filter: {
        quoteId,
      },
    });

    // get previous revisions
  }

  async getCompanyOverview(companyId: string) {
    const company = await companyService.getById(companyId);

    if (!company.success || !company.data) {
      throw new Error("Company not found");
    }

    const customerQuotes = await prisma.quote.findMany({
      where: {
        journey: {
          customerId: companyId,
        },
      },
    });

    const dealerQuotes = await prisma.quote.findMany({
      where: {
        journey: {
          dealerId: companyId,
        },
      },
    });

    return {
      company: company.data,
      customerQuotes,
      dealerQuotes,
    };
  }
}
