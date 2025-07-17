import { NextFunction, Request, Response } from "express";

export class PerformanceController {
  async getPerformanceSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await salesService.getCompanyOverview(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheet(req: Request, res: Response, next: NextFunction) {}

  async createPerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {}

  async updatePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {}

  async deletePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {}
}
