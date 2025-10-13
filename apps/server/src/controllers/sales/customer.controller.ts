import type { Address, Company, Contact } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { addressService, contactService, customerService } from "@/services";
import { buildQueryParams } from "@/utils";

export class CustomerController {
  // Companies
  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.createCompany(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Company>(req.query);
      const result = await customerService.getAllCompanies(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.getCompanyById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.updateCompany(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.deleteCompany(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Addresses
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.createAddress(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Address>(req.query);
      const result = await addressService.getAllAddresses(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.getAddressById(req.params.addressId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.updateAddress(req.params.addressId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.deleteAddress(req.params.addressId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Contacts
  async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.createContact(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Contact>(req.query);
      const result = await contactService.getAllContacts(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.getContactById(req.params.contactId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.updateContact(req.params.contactId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.deleteContact(req.params.contactId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}