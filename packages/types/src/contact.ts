// Auto-generated from Prisma schema
import { ContactType } from './contact-type';

export interface Contact {
  id?: string;
  addressId?: string;
  companyId: string;
  legacyCompanyId?: string;
  firstName: string;
  lastName?: string;
  owner?: string;
  email?: string;
  phone?: string;
  phoneExtension?: string;
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
