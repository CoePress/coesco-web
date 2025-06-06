import { Quote } from "@prisma/client";
import { quoteBuilderService, quoteService } from "@/services";
import { BaseController } from "./_";
import { NextFunction, Request, Response } from "express";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";

  public async buildQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quoteBuilderService.buildQuote(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getQuoteOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await quoteBuilderService.getQuoteOverview(id);
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

  public async addItemToQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { itemId, quantity } = req.body;
      const result = await quoteBuilderService.addItemToQuote(
        id,
        itemId,
        quantity
      );
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

  public async approveQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quoteBuilderService.approveQuote(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quoteService.sendQuote(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async createQuoteRevision(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await quoteService.createQuoteRevision(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
