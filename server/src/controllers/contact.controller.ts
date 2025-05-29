import { contactService } from "@/services";
import { BaseController } from "./_";
import { Contact } from "@prisma/client";

export class ContactController extends BaseController<Contact> {
  protected service = contactService;
  protected entityName = "Contact";
}
