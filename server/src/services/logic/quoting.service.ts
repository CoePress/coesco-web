import { prisma } from "@/utils/prisma";

export class QuotingService {
  async createQuote(user: any, customerId: string) {
    let finalCustomerId = customerId;

    if (!customerId) {
      // const usersDraftCount = await prisma.company.count({
      //   where: {
      //     status: "STAGING",
      //     customerJourneys: {
      //       some: {
      //         createdById: user.id,
      //       },
      //     },
      //   },
      // });

      const stagingCompany = await prisma.company.create({
        data: {
          name: `New Company (${user.id})`,
          status: "STAGING",
        },
      });
      finalCustomerId = stagingCompany.id;
    }

    const journey = await prisma.journey.create({
      data: {
        customerId: finalCustomerId,
        createdById: user.id,
      },
    });

    const quote = await prisma.quote.create({
      data: {
        journeyId: journey.id,
        status: "DRAFT",
        year: new Date().getFullYear(),
        number: "1",
        revision: "A",
      },
    });
  }
}
