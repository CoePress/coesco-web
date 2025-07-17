import { contactService } from "@/services/repository";
import { BaseController } from "./_base.controller";
import { Contact } from "@prisma/client";

export class ContactController extends BaseController<Contact> {
  protected service = contactService;
  protected entityName = "Contact";
}
