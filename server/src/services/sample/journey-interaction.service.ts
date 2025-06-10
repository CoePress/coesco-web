import { JourneyInteraction } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { journeyService } from '.';

type JourneyInteractionAttributes = Omit<JourneyInteraction, "id" | "createdAt" | "updatedAt">;

export class JourneyInteractionService extends BaseService<JourneyInteraction> {
  protected model = prisma.journeyInteraction;
  protected entityName = "JourneyInteraction";
  protected modelName = "journeyInteraction";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: JourneyInteractionAttributes): Promise<void> {
    if (!data.journeyId) {
      throw new BadRequestError("journeyId is required");
    }

    const journey = await journeyService.getById(data.journeyId);
    if (!journey.success || !journey.data) {
      throw new BadRequestError("Journey not found");
    }

    if (!data.interactionType) {
      throw new BadRequestError("interactionType is required");
    }
  }
}
