import { CustomerAddress } from "@prisma/client";
import { BaseService } from "./index";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type CustomerAddressAttributes = Omit<
  CustomerAddress,
  "id" | "createdAt" | "updatedAt"
>;

export class CustomerAddressService extends BaseService<CustomerAddress> {
  protected model = prisma.customerAddress;
  protected entityName = "CustomerAddress";

  protected async validate(
    customerAddress: CustomerAddressAttributes
  ): Promise<void> {
    if (!customerAddress.customerId) {
      throw new BadRequestError("Customer ID is required");
    }
  }
}
