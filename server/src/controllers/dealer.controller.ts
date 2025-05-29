import { dealerService } from "@/services";
import { BaseController } from "./_";
import { Dealer } from "@prisma/client";

export class DealerController extends BaseController<Dealer> {
  protected service = dealerService;
  protected entityName = "Dealer";
}
