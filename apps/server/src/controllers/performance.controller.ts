import { performanceSheetService } from "@/services/repository";
import { NextFunction, Request, Response } from "express";
import { exec } from "child_process";

export class PerformanceController {
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
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.update(id, req.body);

      const data = JSON.stringify({ id, ...req.body, result });
      const scriptOutput = await new Promise<string>((resolve) => {
        exec(
          `python src/scripts/performance-sheet.py '${data}'`,
          (error, stdout, stderr) => {
            resolve(stdout || stderr || "");
          }
        );
      });

      res.status(200).json({ ...result, scriptOutput });
    } catch (error) {
      next(error);
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
}
