import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Contact } from "@prisma/client";

type ContactAttributes = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export class ContactService extends BaseService<Contact> {
  protected model = prisma.contact;
  protected entityName = "Contact";

  protected async validate(contact: ContactAttributes): Promise<void> {
    if (!contact.entityType) {
      throw new BadRequestError("Entity type is required");
    }
    if (!contact.entityId) {
      throw new BadRequestError("Entity ID is required");
    }
  }
}
