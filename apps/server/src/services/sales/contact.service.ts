import type { Contact } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { contactRepository } from "@/repositories";

export class ContactService {
  async createContact(data: Omit<Contact, "id" | "createdAt" | "updatedAt">) {
    return contactRepository.create(data);
  }

  async updateContact(id: string, data: Partial<Omit<Contact, "id" | "createdAt" | "updatedAt">>) {
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
