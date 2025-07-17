import { prisma } from "@/utils/prisma";
import { journeyService, companyService, contactService } from "../repository";

export class SalesService {
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
