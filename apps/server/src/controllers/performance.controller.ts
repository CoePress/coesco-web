import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { performanceSheetLinkService, performanceSheetService, performanceSheetVersionService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class PerformanceController {


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
