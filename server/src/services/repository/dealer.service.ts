import { Dealer } from "@prisma/client";
import { BaseService } from "./index";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type DealerAttributes = Omit<Dealer, "id" | "createdAt" | "updatedAt">;

export class DealerService extends BaseService<Dealer> {
  protected model = prisma.dealer;
  protected entityName = "Dealer";

  protected async validate(dealer: DealerAttributes): Promise<void> {
    if (!dealer.name) {
      throw new BadRequestError("Dealer name is required");
    }
  }
}
