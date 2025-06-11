import { Item } from "@prisma/client";
import { itemService } from "@/services";
import { BaseController } from "./_";

export class ItemController extends BaseController<Item> {
  protected service = itemService;
  protected entityName = "Item";
}
