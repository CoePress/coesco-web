import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Contact } from "@prisma/client";

type ContactAttributes = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export class ContactService extends BaseService<Contact> {
  protected model = prisma.contact;
  protected entityName = "Contact";

  protected async validate(contact: ContactAttributes): Promise<void> {
    if (!contact.companyId) {
      throw new BadRequestError("CompanyId is required");
    }

    const company = await prisma.company.findUnique({
      where: { id: contact.companyId },
    });

    if (!company) {
      throw new BadRequestError("Company not found");
    }

    if (!contact.firstName) {
      throw new BadRequestError("First name is required");
    }
  }
}
