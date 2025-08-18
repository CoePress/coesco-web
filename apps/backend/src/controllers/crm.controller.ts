import type { Address, Company, Contact, Journey } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { addressService, companyService, contactService, journeyService } from "@/services/repository";

export class CRMController {
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
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Company> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Company>,
        include: include ? JSON.parse(include as string) : undefined,
      };
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
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Address> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Address>,
        include: include ? JSON.parse(include as string) : undefined,
      };
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
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Contact> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Contact>,
        include: include ? JSON.parse(include as string) : undefined,
      };
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

  // Journeys
  async createJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Journey> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Journey>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await journeyService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.getById(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.update(req.params.journeyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.delete(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
