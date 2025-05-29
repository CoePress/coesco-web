import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";
import { Contact } from "@prisma/client";

type ContactAttributes = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export class ContactService extends BaseService<Contact> {
  protected model = prisma.contact;
  protected entityName = "Contact";

  protected async validate(contact: ContactAttributes): Promise<void> {
    if (!contact.customerId && !contact.dealerId) {
      throw new BadRequestError("Either customerId or dealerId is required");
    }

    if (contact.customerId && contact.dealerId) {
      throw new BadRequestError(
        "Only one of customerId or dealerId is allowed"
      );
    }

    if (contact.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: contact.customerId },
      });

      if (!customer) {
        throw new BadRequestError("Customer not found");
      }
    }

    if (contact.dealerId) {
      const dealer = await prisma.dealer.findUnique({
        where: { id: contact.dealerId },
      });

      if (!dealer) {
        throw new BadRequestError("Dealer not found");
      }
    }

    if (!contact.firstName) {
      throw new BadRequestError("First name is required");
    }

    if (!contact.lastName) {
      throw new BadRequestError("Last name is required");
    }
  }
}
