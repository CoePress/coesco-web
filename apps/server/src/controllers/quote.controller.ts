import { Quote } from "@prisma/client";
import { BaseController } from "./_base.controller";
import { NextFunction, Request, Response } from "express";
import { quoteService } from "@/services/repository";
import { quoteBuilderService } from "@/services";

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
      const result = await quoteBuilderService.getOverview(id);
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
      const { itemType, itemId, quantity } = req.body;
      const result = await quoteBuilderService.addItem(
        id,
        itemType,
        itemId,
        quantity
      );
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
      const result = await quoteBuilderService.removeItem(itemId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async approveQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quoteBuilderService.approve(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await quoteBuilderService.send(id);
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
      const result = await quoteBuilderService.createRevision(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async updateItemLineNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { itemId } = req.params;
      const { lineNumber } = req.body;
      const result = await quoteBuilderService.updateItemLineNumber(
        itemId,
        lineNumber
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
