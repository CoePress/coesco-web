import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { performanceSheetLinkService, performanceSheetService, performanceSheetVersionService } from "@/services/repository";

export class PerformanceController {
  // Performance Sheet Versions
  async createPerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<PerformanceSheetVersion> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<PerformanceSheetVersion>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await performanceSheetVersionService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Performance Sheet
  async createPerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<PerformanceSheet> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<PerformanceSheet>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await performanceSheetService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Performance Sheet Link
  async createPerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<PerformanceSheetLink> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<PerformanceSheetLink>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await performanceSheetLinkService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
