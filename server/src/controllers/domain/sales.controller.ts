import { salesService } from "@/services";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import { Response, NextFunction } from "express";

export class SalesController {
  async createSandboxQuote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await salesService.createSandboxQuote(req.employee);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getQuoteOverview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await salesService.getQuoteOverview(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyOverview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await salesService.getCompanyOverview(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
