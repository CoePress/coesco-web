import { Configuration } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { productClassService } from '.';

type ConfigurationAttributes = Omit<Configuration, "id" | "createdAt" | "updatedAt">;

export class ConfigurationService extends BaseService<Configuration> {
  protected model = prisma.configuration;
  protected entityName = "Configuration";
  protected modelName = "configuration";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ConfigurationAttributes): Promise<void> {
    if (!data.productClassId) {
      throw new BadRequestError("productClassId is required");
    }

    const productClass = await productClassService.getById(data.productClassId);
    if (!productClass.success || !productClass.data) {
      throw new BadRequestError("ProductClass not found");
    }

    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.isTemplate) {
      throw new BadRequestError("isTemplate is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }
  }
}
