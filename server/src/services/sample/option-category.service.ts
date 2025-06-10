import { OptionCategory } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type OptionCategoryAttributes = Omit<OptionCategory, "id" | "createdAt" | "updatedAt">;

export class OptionCategoryService extends BaseService<OptionCategory> {
  protected model = prisma.optionCategory;
  protected entityName = "OptionCategory";
  protected modelName = "optionCategory";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: OptionCategoryAttributes): Promise<void> {
    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.isRequired) {
      throw new BadRequestError("isRequired is required");
    }

    if (!data.allowMultiple) {
      throw new BadRequestError("allowMultiple is required");
    }

    if (!data.displayOrder) {
      throw new BadRequestError("displayOrder is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }
  }
}
