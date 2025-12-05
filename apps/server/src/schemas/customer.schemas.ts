import { CompanyStatus, ContactType, Industry } from "@prisma/client";
import { z } from "zod";

export const CreateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  fax: z.string().optional(),
  industry: z.nativeEnum(Industry).optional(),
  yearFounded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  revenue: z.number().int().optional(),
  employeeCount: z.string().optional(),
  customerSince: z.coerce.date().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().int().optional(),
  taxId: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
  legacy: z.record(z.any()).optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CreateAddressSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdateAddressSchema = CreateAddressSchema.partial().omit({ companyId: true });

export const CreateContactSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  addressId: z.string().nullable().optional(),
  legacyCompanyId: z.string().nullable().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  phoneExtension: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.nativeEnum(ContactType).optional(),
  isPrimary: z.boolean().optional(),
  imageId: z.number().int().nullable().optional(),
  profileUrl: z.string().nullable().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial().omit({ companyId: true });

export const CreateJourneyContactSchema = z.object({
  journeyId: z.string().uuid("Invalid journey ID"),
  contactId: z.string().uuid("Invalid contact ID"),
  isPrimary: z.boolean().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

export const UpdateJourneyContactSchema = CreateJourneyContactSchema.partial().omit({ journeyId: true, contactId: true });

export const CreateCompanyRelationshipSchema = z.object({
  parentId: z.string().min(1, "Parent company ID is required"),
  childId: z.string().min(1, "Child company ID is required"),
  relationshipType: z.string().nullable().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

export const UpdateCompanyRelationshipSchema = CreateCompanyRelationshipSchema.partial().omit({ parentId: true, childId: true });
