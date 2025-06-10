import { ProductClassOptionCategory } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { productClassService } from '.';
import { optionCategoryService } from '.';

type ProductClassOptionCategoryAttributes = Omit<ProductClassOptionCategory, "id" | "createdAt" | "updatedAt">;

export class ProductClassOptionCategoryService extends BaseService<ProductClassOptionCategory> {
  protected model = prisma.productClassOptionCategory;
  protected entityName = "ProductClassOptionCategory";
  protected modelName = "productClassOptionCategory";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ProductClassOptionCategoryAttributes): Promise<void> {
    if (!data.productClassId) {
      throw new BadRequestError("productClassId is required");
    }

    const productClass = await productClassService.getById(data.productClassId);
    if (!productClass.success || !productClass.data) {
      throw new BadRequestError("ProductClass not found");
    }

    if (!data.optionCategoryId) {
      throw new BadRequestError("optionCategoryId is required");
    }

    const optionCategory = await optionCategoryService.getById(data.optionCategoryId);
    if (!optionCategory.success || !optionCategory.data) {
      throw new BadRequestError("OptionCategory not found");
    }
  }
}
