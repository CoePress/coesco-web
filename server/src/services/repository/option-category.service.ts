import { OptionCategory } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type OptionCategoryAttributes = Omit<
  OptionCategory,
  "id" | "createdAt" | "updatedAt"
>;

export class OptionCategoryService extends BaseService<OptionCategory> {
  protected model = prisma.optionCategory;
  protected entityName = "OptionCategory";
  protected modelName = "optionCategory";

  protected async validate(
    optionCategory: OptionCategoryAttributes
  ): Promise<void> {
    if (!optionCategory.name) {
      throw new BadRequestError("Name is required");
    }
  }
}
