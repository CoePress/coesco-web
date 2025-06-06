import { BadRequestError } from "@/middleware/error.middleware";
import { getEmployeeContext } from "@/utils/context";
import {
  CompanyStatus,
  JourneyStatus,
  Quote,
  QuoteStatus,
} from "@prisma/client";
import {
  companyService,
  employeeService,
  journeyService,
  quoteItemService,
  quoteService,
} from "..";
import { prisma } from "@/utils/prisma";

export class QuoteBuilderService {
  async buildQuote(data: any) {
    const { customerId, journeyId, customerName, journeyName } = data;

    const employee = getEmployeeContext();
    const quoteNumber = await quoteService.generateQuoteNumber(true);

    if (customerId && journeyId) {
      return await quoteService.create({
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
    } else if (customerId && journeyName) {
      const journey = await journeyService.create({
        customer: { connect: { id: customerId } },
        createdBy: { connect: { id: employee.id } },
        name: journeyName,
        status: JourneyStatus.ACTIVE,
      });

      if (!journey.success || !journey.data) {
        throw new BadRequestError("Failed to create journey");
      }

      const quote = await quoteService.create({
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

      const quote = await quoteService.create({
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
      return await quoteService.create({
        status: QuoteStatus.DRAFT,
        year: quoteNumber.year,
        number: quoteNumber.number,
        revision: "A",
        subtotal: 0,
        totalAmount: 0,
        currency: "USD",
        createdById: employee.id,
      });
    }
  }

  async addItemToQuote() {}

  async removeItemFromQuote() {}

  async updateItemInQuote() {}

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
