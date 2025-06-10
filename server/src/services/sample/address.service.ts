import { Address } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { companyService } from '.';

type AddressAttributes = Omit<Address, "id" | "createdAt" | "updatedAt">;

export class AddressService extends BaseService<Address> {
  protected model = prisma.address;
  protected entityName = "Address";
  protected modelName = "address";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: AddressAttributes): Promise<void> {
    if (!data.companyId) {
      throw new BadRequestError("companyId is required");
    }

    const company = await companyService.getById(data.companyId);
    if (!company.success || !company.data) {
      throw new BadRequestError("Company not found");
    }

    if (!data.addressLine1) {
      throw new BadRequestError("addressLine1 is required");
    }

    if (!data.isPrimary) {
      throw new BadRequestError("isPrimary is required");
    }
  }
}
