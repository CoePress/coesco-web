import type { PerformanceSheetLink } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { buildQueryParams } from "@/utils";
import { performanceSheetLinkRepository } from "@/repositories";

export class PerformanceController {
  // Performance Sheet Link
  async createPerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkRepository.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<PerformanceSheetLink>(req.query);
      const result = await performanceSheetLinkRepository.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkRepository.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkRepository.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkRepository.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
