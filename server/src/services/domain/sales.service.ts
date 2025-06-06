import { prisma } from "@/utils/prisma";
import {
  quoteService,
  quoteItemService,
  journeyService,
  companyService,
  contactService,
  employeeService,
} from "..";

// TODO: make this transactional

export class SalesService {
  async getQuoteOverview(quoteId: string) {
    const quote = await quoteService.getById(quoteId);

    if (!quote.success || !quote.data) {
      throw new Error("Quote not found");
    }

    let creator: any;
    if (quote.data.createdById !== "system") {
      creator = await employeeService.getById(quote.data.createdById);

      if (!creator.success || !creator.data) {
        throw new Error("Creator not found");
      }
    } else {
      creator = {
        success: true,
        data: {
          id: "system",
          firstName: "System",
          lastName: "System",
          email: "system@system.com",
          phone: "+1234567890",
          imageUrl: "https://via.placeholder.com/150",
        },
      };
    }

    let approvedBy: any;
    if (quote.data.approvedById) {
      approvedBy = await employeeService.getById(quote.data.approvedById);

      if (!approvedBy.success || !approvedBy.data) {
        throw new Error("Approved by not found");
      }
    } else {
      approvedBy = {
        success: true,
        data: {
          id: "system",
          firstName: "System",
          lastName: "System",
        },
      };
    }

    let journey = null;
    let customer = null;
    let dealer = null;

    if (quote.data.journeyId) {
      const journeyResult = await journeyService.getById(quote.data.journeyId);
      if (journeyResult.success && journeyResult.data) {
        journey = journeyResult.data;

        if (journey.customerId) {
          const customerResult = await companyService.getById(
            journey.customerId
          );
          if (customerResult.success && customerResult.data) {
            customer = customerResult.data;
          }
        }

        if (journey.dealerId) {
          const dealerResult = await companyService.getById(journey.dealerId);
          if (dealerResult.success && dealerResult.data) {
            dealer = dealerResult.data;
          }
        }
      }
    }

    const quoteItems = await quoteItemService.getAll({
      filter: {
        quoteId,
      },
      include: ["item"],
    });

    return {
      success: true,
      data: {
        quote: {
          ...quote.data,
          createdBy: creator?.data,
          approvedBy: approvedBy?.data,
        },
        journey,
        quoteItems: quoteItems.data,
        customer,
        dealer,
      },
    };
  }

  async getJourneyOverview(journeyId: string) {
    const journey = await journeyService.getById(journeyId);

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

    return {
      success: true,
      data: {
        journey: journey.data,
        customer: customer?.data,
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
}
