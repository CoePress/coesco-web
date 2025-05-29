import { Customer } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type CustomerAttributes = Omit<Customer, "id" | "createdAt" | "updatedAt">;

export class CustomerService extends BaseService<Customer> {
  protected model = prisma.customer;
  protected entityName = "Customer";

  protected async validate(customer: CustomerAttributes): Promise<void> {
    if (!customer.name) {
      throw new BadRequestError("Customer name is required");
    }
  }
}
