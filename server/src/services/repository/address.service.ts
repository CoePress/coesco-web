import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Address } from "@prisma/client";

type AddressAttributes = Omit<Address, "id" | "createdAt" | "updatedAt">;

export class AddressService extends BaseService<Address> {
  protected model = prisma.address;
  protected entityName = "Address";

  protected async validate(address: AddressAttributes): Promise<void> {
    if (!address.entityType) {
      throw new BadRequestError("Entity type is required");
    }
    if (!address.entityId) {
      throw new BadRequestError("Entity ID is required");
    }
  }
}
