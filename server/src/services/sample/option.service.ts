import { Option } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type OptionAttributes = Omit<Option, "id" | "createdAt" | "updatedAt">;

export class OptionService extends BaseService<Option> {
  protected model = prisma.option;
  protected entityName = "Option";
  protected modelName = "option";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: OptionAttributes): Promise<void> {
    if (!data.categoryId) {
      throw new BadRequestError("categoryId is required");
    }

    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.code) {
      throw new BadRequestError("code is required");
    }

    if (!data.price) {
      throw new BadRequestError("price is required");
    }

    if (!data.displayOrder) {
      throw new BadRequestError("displayOrder is required");
    }

    if (!data.isDefault) {
      throw new BadRequestError("isDefault is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }
  }
}
