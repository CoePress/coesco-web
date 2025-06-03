import { Quote } from "@prisma/client";
import { quoteService, salesService } from "@/services";
import { BaseController } from "./_";
import { NextFunction, Request, Response } from "express";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";

  public async getItems(req: Request, res: Response, next: NextFunction) {
    try {
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

  public async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
