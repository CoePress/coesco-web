import { prisma } from "@/utils/prisma";

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
        number: "1",
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
}
