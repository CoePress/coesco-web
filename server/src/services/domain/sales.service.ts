import { prisma } from "@/utils/prisma";
import {
  quoteService,
  quoteItemService,
  journeyService,
  companyService,
  contactService,
} from "..";
import { BadRequestError } from "@/middleware/error.middleware";

// TODO: make this transactional

export class SalesService {
  async createSandboxQuote(employee: any) {
    const quoteNumber = await quoteService.generateQuoteNumber(true);

    const userInitials = `${employee.firstName[0]}${employee.lastName[0]}`;

    // Find the latest sandbox company number for this user
    const latestCompany = await prisma.company.findFirst({
      where: {
        name: {
          startsWith: `Sandbox Company (${userInitials}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract the number from the latest company name or start with 1
    let companyNumber = 1;
    if (latestCompany) {
      const match = latestCompany.name.match(/\(${userInitials}-(\d+)\)/);
      if (match) {
        companyNumber = parseInt(match[1]) + 1;
      }
    }

    const company = await companyService.create({
      name: `Sandbox Company (${userInitials}-${companyNumber
        .toString()
        .padStart(4, "0")})`,
      website: "sandbox.com",
      email: "sandbox@sandbox.com",
      phone: "+1234567890",
      fax: "+1234567890",
      industry: "OTHER",
      yearFounded: 2020,
      revenue: 1000000,
      employeeCount: "10",
      customerSince: new Date(),
      paymentTerms: "NET 30",
      creditLimit: 100000,
      taxId: "1234567890",
      logoUrl:
        "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/company-logo-design-template-e089327a5c476ce5c70c74f7359c5898_screen.jpg?ts=1672291305",
      status: "STAGING",
    });

    if (!company.success || !company.data) {
      throw new BadRequestError("Company not created");
    }

    // Find the latest sandbox journey number for this user
    const latestJourney = await prisma.journey.findFirst({
      where: {
        name: {
          startsWith: `Sandbox Journey (${userInitials}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract the number from the latest journey name or start with 1
    let journeyNumber = 1;
    if (latestJourney?.name) {
      const match = latestJourney.name.match(/\(${userInitials}-(\d+)\)/);
      if (match) {
        journeyNumber = parseInt(match[1]) + 1;
      }
    }

    // sandbox journey
    const journey = await journeyService.create({
      customer: { connect: { id: company.data.id } },
      createdBy: { connect: { id: employee.id } },
      name: `Sandbox Journey (${userInitials}-${journeyNumber
        .toString()
        .padStart(4, "0")})`,
      priority: "LOW",
      confidence: 1,
    });

    if (!journey.success || !journey.data) {
      throw new BadRequestError("Journey not created");
    }

    // sandbox quote
    const quote = await quoteService.create({
      journeyId: journey.data.id,
      status: "DRAFT",
      year: quoteNumber.year,
      number: quoteNumber.number,
      revision: "A",
      subtotal: 0,
      totalAmount: 0,
      currency: "USD",
      createdById: employee.id,
    });

    if (!quote.success || !quote.data) {
      throw new BadRequestError("Quote not created");
    }

    return {
      company,
      journey,
      quote,
    };
  }

  async createCustomerQuote(user: any, customerId: string) {}

  async createRevision(user: any, quoteId: string) {}

  async approveQuote(quoteId: string) {}

  async getQuoteOverview(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new Error("Quote not found");
    }

    const journey = await journeyService.getById(quote.data.journeyId);

    if (!journey.success || !journey.data) {
      throw new Error("Journey not found");
    }

    let customer: any;
    if (journey.data.customerId) {
      customer = await companyService.getById(journey.data.customerId);

      if (!customer.success || !customer.data) {
        throw new Error("Customer not found");
      }
    }

    let dealer: any;
    if (journey.data.dealerId) {
      dealer = await companyService.getById(journey.data.dealerId);

      if (!dealer.success || !dealer.data) {
        throw new Error("Dealer not found");
      }
    }

    const quoteItems = await quoteItemService.getAll({
      filter: {
        quoteId,
      },
    });

    return {
      success: true,
      data: {
        quote: quote.data,
        journey: journey.data,
        quoteItems: quoteItems.data,
        customer: customer?.data,
        dealer: dealer?.data,
      },
    };
  }

  async getCompanyOverview(companyId: string) {
    const company = await companyService.getById(companyId);

    if (!company.success || !company.data) {
      throw new Error("Company not found");
    }

    const primaryContact = await contactService.getAll({
      filter: {
        companyId,
        isPrimary: true,
      },
    });

    const contacts = await contactService.getAll({
      filter: {
        companyId,
      },
    });

    if (!contacts.success || !contacts.data) {
      throw new Error("Contacts not found");
    }

    const additionalContacts = contacts.data.filter(
      (contact) => !contact.isPrimary
    );

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
      success: true,
      data: {
        company: company.data,
        primaryContact: primaryContact.data,
        additionalContacts,
        customerQuotes,
        dealerQuotes,
      },
    };
  }

  async transferQuoteToCustomer(quoteId: string, newCustomerId: string) {
    // if new customer doesn't have a journey, create one

    const customer = await companyService.getById(newCustomerId);

    if (!customer.success || !customer.data) {
      throw new Error("Customer not found");
    }

    const journey = await journeyService.getAll({
      filter: {
        customerId: newCustomerId,
      },
    });
  }
}
