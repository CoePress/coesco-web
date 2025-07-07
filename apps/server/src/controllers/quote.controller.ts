import { Quote } from "@prisma/client";
import { quotingService, quoteService } from "@/services";
import { BaseController } from "./_base.controller";
import { NextFunction, Request, Response } from "express";

export class QuoteController extends BaseController<Quote> {
  protected service = quoteService;
  protected entityName = "Quote";

  public async buildQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotingService.buildQuote(req.body);
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
      const result = await quotingService.getQuoteOverview(id);
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
      const result = await quotingService.addItemToQuote(id, itemId, quantity);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async removeItemFromQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { itemId } = req.params;
      const result = await quotingService.removeItemFromQuote(itemId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async approveQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quotingService.approveQuote(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quotingService.sendQuote(id);
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
      const result = await quotingService.createQuoteRevision(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async addConfigurationToQuote(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await quotingService.addConfigurationToQuote(
        req.params.quoteId,
        req.params.configurationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async updateQuoteItemLineNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { itemId } = req.params;
      const { lineNumber } = req.body;
      const result = await quotingService.updateQuoteItemLineNumber(
        itemId,
        lineNumber
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
