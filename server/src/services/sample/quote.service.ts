import { Quote } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { journeyService } from '.';

type QuoteAttributes = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export class QuoteService extends BaseService<Quote> {
  protected model = prisma.quote;
  protected entityName = "Quote";
  protected modelName = "quote";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: QuoteAttributes): Promise<void> {
    if (!data.year) {
      throw new BadRequestError("year is required");
    }

    if (!data.number) {
      throw new BadRequestError("number is required");
    }

    if (!data.revision) {
      throw new BadRequestError("revision is required");
    }

    if (!data.status) {
      throw new BadRequestError("status is required");
    }

    if (!data.createdById) {
      throw new BadRequestError("createdById is required");
    }
  }
}
