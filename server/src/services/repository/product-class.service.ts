import { ProductClass } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type ProductClassAttributes = Omit<
  ProductClass,
  "id" | "createdAt" | "updatedAt"
>;

export class ProductClassService extends BaseService<ProductClass> {
  protected model = prisma.productClass;
  protected entityName = "ProductClass";

  protected async validate(
    productClass: ProductClassAttributes
  ): Promise<void> {
    if (!productClass.name) {
      throw new BadRequestError("Name is required");
    }
  }
}
