import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { performanceSheetLinkService, performanceSheetService, performanceSheetVersionService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

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
      const params = buildQueryParams<PerformanceSheetVersion>(req.query);
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
      const result = await performanceSheetService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<PerformanceSheet>(req.query);
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
      const params = buildQueryParams<PerformanceSheetLink>(req.query);
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
