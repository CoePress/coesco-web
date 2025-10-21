// Auto-generated from Prisma schema
import { ContactType } from './contact-type';

export interface Contact {
  id?: string;
  companyId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  type?: ContactType;
  isPrimary?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;
export type UpdateContactInput = Partial<CreateContactInput>;
