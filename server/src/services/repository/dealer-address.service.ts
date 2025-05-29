import { DealerAddress } from "@prisma/client";
import { BaseService } from "./index";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type DealerAddressAttributes = Omit<
  DealerAddress,
  "id" | "createdAt" | "updatedAt"
>;

export class DealerAddressService extends BaseService<DealerAddress> {
  protected model = prisma.dealerAddress;
  protected entityName = "DealerAddress";

  protected async validate(
    dealerAddress: DealerAddressAttributes
  ): Promise<void> {
    if (!dealerAddress.dealerId) {
      throw new BadRequestError("Dealer ID is required");
    }
  }
}
