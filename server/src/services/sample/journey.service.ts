import { Journey } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type JourneyAttributes = Omit<Journey, "id" | "createdAt" | "updatedAt">;

export class JourneyService extends BaseService<Journey> {
  protected model = prisma.journey;
  protected entityName = "Journey";
  protected modelName = "journey";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: JourneyAttributes): Promise<void> {
    if (!data.createdById) {
      throw new BadRequestError("createdById is required");
    }
  }
}
