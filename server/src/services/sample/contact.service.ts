import { Contact } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";
import { companyService } from '.';

type ContactAttributes = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export class ContactService extends BaseService<Contact> {
  protected model = prisma.contact;
  protected entityName = "Contact";
  protected modelName = "contact";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ContactAttributes): Promise<void> {
    if (!data.companyId) {
      throw new BadRequestError("companyId is required");
    }

    const company = await companyService.getById(data.companyId);
    if (!company.success || !company.data) {
      throw new BadRequestError("Company not found");
    }

    if (!data.firstName) {
      throw new BadRequestError("firstName is required");
    }

    if (!data.isPrimary) {
      throw new BadRequestError("isPrimary is required");
    }
  }
}
