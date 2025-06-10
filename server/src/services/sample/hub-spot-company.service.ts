import { HubSpotCompany } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type HubSpotCompanyAttributes = Omit<HubSpotCompany, "id" | "createdAt" | "updatedAt">;

export class HubSpotCompanyService extends BaseService<HubSpotCompany> {
  protected model = prisma.hubSpotCompany;
  protected entityName = "HubSpotCompany";
  protected modelName = "hubSpotCompany";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: HubSpotCompanyAttributes): Promise<void> {
    if (!data.name) {
      throw new BadRequestError("name is required");
    }
  }
}
