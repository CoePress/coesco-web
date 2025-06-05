import { Quote } from "@prisma/client";
import { quoteService, salesService } from "@/services";
import { BaseController } from "./_";
import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";

  public async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quoteService.createQuote(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  public async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await salesService.getQuoteOverview(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async createSandboxQuote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await salesService.createSandboxQuote();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { itemId, quantity } = req.body;
      const result = await quoteService.addItemToQuote(id, itemId, quantity);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, itemId } = req.params;
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
