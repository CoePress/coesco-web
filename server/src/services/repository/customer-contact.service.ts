import { CustomerContact } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type CustomerContactAttributes = Omit<
  CustomerContact,
  "id" | "createdAt" | "updatedAt"
>;

export class CustomerContactService extends BaseService<CustomerContact> {
  protected model = prisma.customerContact;
  protected entityName = "CustomerContact";

  protected async validate(
    customerContact: CustomerContactAttributes
  ): Promise<void> {
    if (!customerContact.customerId) {
      throw new BadRequestError("Customer ID is required");
    }
  }
}
