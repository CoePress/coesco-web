import { DealerContact } from "@prisma/client";
import { BaseService } from "./index";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type DealerContactAttributes = Omit<
  DealerContact,
  "id" | "createdAt" | "updatedAt"
>;

export class DealerContactService extends BaseService<DealerContact> {
  protected model = prisma.dealerContact;
  protected entityName = "DealerContact";

  protected async validate(
    dealerContact: DealerContactAttributes
  ): Promise<void> {
    if (!dealerContact.dealerId) {
      throw new BadRequestError("Dealer ID is required");
    }
  }
}
