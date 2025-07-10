import { Journey } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type JourneyAttributes = Omit<Journey, "id" | "createdAt" | "updatedAt">;

export class JourneyService extends BaseService<Journey> {
  protected model = prisma.journey;
  protected entityName = "Journey";
  protected modelName = "journey";

  protected async validate(journey: JourneyAttributes | any): Promise<void> {
    const customerId = journey.customerId || journey.customer?.connect?.id;

    if (!customerId) {
      throw new BadRequestError("Customer ID is required");
    }
  }
}
