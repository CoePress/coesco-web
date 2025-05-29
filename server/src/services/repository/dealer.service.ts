import { Dealer } from "@prisma/client";
import { BaseService } from "./_";
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

    if (!dealer.code) {
      throw new BadRequestError("Dealer code is required");
    }

    if (dealer.code.length !== 3) {
      throw new BadRequestError("Dealer code must be 3 characters long");
    }

    const dealerWithSameCode = await this.model.findUnique({
      where: { code: dealer.code },
    });

    if (dealerWithSameCode) {
      throw new BadRequestError("Dealer code already exists");
    }
  }
}
