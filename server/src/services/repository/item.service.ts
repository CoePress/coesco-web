import { Item } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type ItemAttributes = Omit<Item, "id" | "createdAt" | "updatedAt">;

export class ItemService extends BaseService<Item> {
  protected model = prisma.item;
  protected entityName = "Item";

  protected async validate(item: ItemAttributes): Promise<void> {
    if (!item.name) {
      throw new BadRequestError("Name is required");
    }
  }
}
