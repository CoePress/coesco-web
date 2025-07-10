import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Address } from "@prisma/client";

type AddressAttributes = Omit<Address, "id" | "createdAt" | "updatedAt">;

export class AddressService extends BaseService<Address> {
  protected model = prisma.address;
  protected entityName = "Address";
  protected modelName = "address";

  protected async validate(address: AddressAttributes): Promise<void> {
    if (!address.companyId) {
      throw new BadRequestError("CompanyId is required");
    }

    const company = await prisma.company.findUnique({
      where: { id: address.companyId },
    });

    if (!company) {
      throw new BadRequestError("Company not found");
    }

    if (!address.addressLine1) {
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
