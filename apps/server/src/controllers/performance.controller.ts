import {
  performanceSheetService,
  performanceSheetVersionService,
} from "@/services/repository";
import { NextFunction, Request, Response } from "express";
import { spawn, spawnSync } from "child_process";

export class PerformanceController {
  // Performance Sheets
  async getPerformanceSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.getAll({});
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const performanceVersion = await performanceSheetVersionService.getById(
        req.body.versionId
      );

      // extract sections and their fields
      // add sections and fields to the performance sheet with null values

      const result = await performanceSheetService.create(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.update(id, req.body);
      const updatedData = JSON.stringify(result.data);

      const pyResult = spawnSync(
        "python",
        ["src/scripts/performance-sheet.py"],
        {
          input: updatedData,
          encoding: "utf-8",
        }
      );

      if (pyResult.error) throw pyResult.error;
      if (pyResult.status !== 0)
        throw new Error(pyResult.stderr || "Script error");

      const parsed = JSON.parse(pyResult.stdout);

      res.status(200).json({
        ...result,
        parsed,
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Performance Sheet Versions
  async getPerformanceSheetVersions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await performanceSheetVersionService.getAll({});
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await performanceSheetVersionService.create(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.update(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
