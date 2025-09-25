import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { performanceSheetLinkService, performanceSheetService, performanceSheetVersionService } from "@/services/repository";
import { PerformanceAutoFillService } from "@/services/performance-autofill.service";
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
      const result = await performanceSheetVersionService.getById(req.params.versionId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.update(req.params.versionId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetVersionService.delete(req.params.versionId);
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
      const result = await performanceSheetService.getById(req.params.sheetId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.update(req.params.sheetId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.delete(req.params.sheetId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Auto-fill endpoint
  async autoFillPerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { sheetId } = req.params;
      const inputData = req.body;

      // Check if sufficient data exists for auto-fill
      if (!PerformanceAutoFillService.hasSufficientData(inputData)) {
        return res.status(400).json({
          success: false,
          error: "Insufficient data for auto-fill. Please provide at least material type, thickness, yield strength, coil width, and feed rates.",
          hasSufficientData: false
        });
      }

      // Generate auto-fill values
      const autoFillResult = await PerformanceAutoFillService.generateAutoFillValues(inputData);

      if (!autoFillResult.success) {
        return res.status(500).json(autoFillResult);
      }

      // Optionally merge with existing data (controlled by query param)
      const shouldMerge = req.query.merge === 'true';
      let finalData = autoFillResult.autoFillValues;

      if (shouldMerge) {
        const mergeOptions = {
          preserveUserInput: req.query.preserveUserInput !== 'false', // Default true
          prioritizeModels: req.query.prioritizeModels !== 'false'    // Default true
        };

        finalData = PerformanceAutoFillService.mergeAutoFillValues(
          inputData,
          autoFillResult.autoFillValues,
          mergeOptions
        );
      }

      // Return the auto-fill results
      res.status(200).json({
        success: true,
        data: finalData,
        metadata: {
          ...autoFillResult.metadata,
          fillableTabs: autoFillResult.fillableTabs,
          merged: shouldMerge,
          sheetId: sheetId
        }
      });

    } catch (error) {
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
      const result = await performanceSheetLinkService.getById(req.params.linkId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.update(req.params.linkId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetLinkService.delete(req.params.linkId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
