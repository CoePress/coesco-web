import type { NextFunction, Request, Response } from "express";

export class CustomerController {
    // Companies
  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Company>(req.query);
      const result = await companyService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

    // Addresses
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Address>(req.query);
      const result = await addressService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.getById(req.params.addressId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.update(req.params.addressId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await addressService.delete(req.params.addressId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Contacts
  async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Contact>(req.query);
      const result = await contactService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.getById(req.params.contactId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.update(req.params.contactId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contactService.delete(req.params.contactId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}