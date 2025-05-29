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

    if (address.entityType === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { id: address.entityId },
      });
      if (!customer) {
        throw new BadRequestError("Customer not found");
      }
    }

    if (address.entityType === "DEALER") {
      const dealer = await prisma.dealer.findUnique({
        where: { id: address.entityId },
      });
      if (!dealer) {
        throw new BadRequestError("Dealer not found");
      }
    }

    if (!address.address1) {
      throw new BadRequestError("Address line 1 is required");
    }

    if (!address.city) {
      throw new BadRequestError("City is required");
    }

    if (!address.state) {
      throw new BadRequestError("State is required");
    }

    if (!address.zip) {
      throw new BadRequestError("Zip code is required");
    }

    if (address.zip.length !== 5) {
      throw new BadRequestError("Zip code must be 5 characters long");
    }

    if (!address.country) {
      throw new BadRequestError("Country is required");
    }
  }
}
