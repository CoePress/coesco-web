import { ProductClass } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type ProductClassAttributes = Omit<ProductClass, "id" | "createdAt" | "updatedAt">;

export class ProductClassService extends BaseService<ProductClass> {
  protected model = prisma.productClass;
  protected entityName = "ProductClass";
  protected modelName = "productClass";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ProductClassAttributes): Promise<void> {
    if (!data.code) {
      throw new BadRequestError("code is required");
    }

    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.depth) {
      throw new BadRequestError("depth is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }
  }
}
