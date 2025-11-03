import type { Address, Company, Contact, JourneyContact } from "@prisma/client";
import type { Request, Response } from "express";

import { CompanyStatus, ContactType, Industry } from "@prisma/client";
import { z } from "zod";

import { addressService, contactService, customerService, journeyContactService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateCompanySchema = z.object({
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

const UpdateCompanySchema = CreateCompanySchema.partial();

const CreateAddressSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const UpdateAddressSchema = CreateAddressSchema.partial().omit({ companyId: true });

const CreateContactSchema = z.object({
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
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

const UpdateContactSchema = CreateContactSchema.partial().omit({ companyId: true });

const CreateJourneyContactSchema = z.object({
  journeyId: z.string().uuid("Invalid journey ID"),
  contactId: z.string().uuid("Invalid contact ID"),
  isPrimary: z.boolean().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

const UpdateJourneyContactSchema = CreateJourneyContactSchema.partial().omit({ journeyId: true, contactId: true });

export class CustomerController {
  // Companies
  createCompany = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateCompanySchema.parse(req.body);
    const result = await customerService.createCompany(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getCompanies = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Company>(req.query);
    const result = await customerService.getAllCompanies(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getCompany = asyncWrapper(async (req: Request, res: Response) => {
    const result = await customerService.getCompanyById(req.params.companyId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateCompany = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateCompanySchema.parse(req.body);
    const result = await customerService.updateCompany(req.params.companyId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteCompany = asyncWrapper(async (req: Request, res: Response) => {
    const result = await customerService.deleteCompany(req.params.companyId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  // Addresses
  createAddress = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateAddressSchema.parse(req.body);
    const result = await addressService.createAddress(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getAddresses = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Address>(req.query);
    const result = await addressService.getAllAddresses(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getAddress = asyncWrapper(async (req: Request, res: Response) => {
    const result = await addressService.getAddressById(req.params.addressId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateAddress = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateAddressSchema.parse(req.body);
    const result = await addressService.updateAddress(req.params.addressId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteAddress = asyncWrapper(async (req: Request, res: Response) => {
    const result = await addressService.deleteAddress(req.params.addressId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  // Contacts
  createContact = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateContactSchema.parse(req.body);
    const result = await contactService.createContact(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getContacts = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Contact>(req.query);
    const result = await contactService.getAllContacts(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getContact = asyncWrapper(async (req: Request, res: Response) => {
    const result = await contactService.getContactById(req.params.contactId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateContact = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateContactSchema.parse(req.body);
    const result = await contactService.updateContact(req.params.contactId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteContact = asyncWrapper(async (req: Request, res: Response) => {
    const result = await contactService.deleteContact(req.params.contactId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  createJourneyContact = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateJourneyContactSchema.parse(req.body);
    const result = await journeyContactService.createJourneyContact(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getJourneyContacts = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<JourneyContact>(req.query);
    const result = await journeyContactService.getAllJourneyContacts(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getJourneyContact = asyncWrapper(async (req: Request, res: Response) => {
    const result = await journeyContactService.getJourneyContactById(req.params.journeyContactId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateJourneyContact = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateJourneyContactSchema.parse(req.body);
    const result = await journeyContactService.updateJourneyContact(req.params.journeyContactId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteJourneyContact = asyncWrapper(async (req: Request, res: Response) => {
    const result = await journeyContactService.deleteJourneyContact(req.params.journeyContactId);
    res.status(HTTP_STATUS.OK).json(result);
  });
}
