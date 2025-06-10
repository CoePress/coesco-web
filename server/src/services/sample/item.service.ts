import { Item } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type ItemAttributes = Omit<Item, "id" | "createdAt" | "updatedAt">;

export class ItemService extends BaseService<Item> {
  protected model = prisma.item;
  protected entityName = "Item";
  protected modelName = "item";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ItemAttributes): Promise<void> {
    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.unitPrice) {
      throw new BadRequestError("unitPrice is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }

    if (!data.createdById) {
      throw new BadRequestError("createdById is required");
    }
  }
}
