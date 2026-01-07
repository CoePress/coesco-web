import type { Contact } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { contactRepository } from "@/repositories";

export class ContactService {
  async createContact(data: Partial<Contact>) {
    return contactRepository.create(data);
  }

  async updateContact(id: string, data: Partial<Contact>) {
    return contactRepository.update(id, data);
  }

  async deleteContact(id: string) {
    return contactRepository.delete(id);
  }

  async getAllContacts(params?: IQueryParams<Contact>) {
    return contactRepository.getAll(params);
  }

  async getContactById(id: string, params?: IQueryParams<Contact>) {
    return contactRepository.getById(id, params);
  }
}
