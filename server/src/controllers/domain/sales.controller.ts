import { salesService } from "@/services";
import { BaseController } from "../repository/_";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import { Response, NextFunction } from "express";

export class SalesController {
  async createSandboxQuote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await salesService.createSandboxQuote(req.user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
