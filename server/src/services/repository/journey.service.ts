import { Journey } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type JourneyAttributes = Omit<Journey, "id" | "createdAt" | "updatedAt">;

export class JourneyService extends BaseService<Journey> {
  protected model = prisma.journey;
  protected entityName = "Journey";

  protected async validate(journey: JourneyAttributes): Promise<void> {
    if (!journey.customerId) {
      throw new BadRequestError("Customer ID is required");
    }
  }
}
