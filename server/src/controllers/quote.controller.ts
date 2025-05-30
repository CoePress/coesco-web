import { Quote } from "@prisma/client";
import { quoteService, quotingService } from "@/services";
import { BaseController } from "./_";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";

  async createQuote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { customerId } = req.body;
      const result = await quotingService.createQuote(req.user, customerId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
