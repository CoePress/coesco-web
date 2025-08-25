import type { Quote } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { quoteBuilderService } from "@/services";
import { quoteService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class QuoteController {
  // Quotes
  async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quoteBuilderService.createQuote(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Quote>(req.query);
      const result = await quoteService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Quote Items
  async createQuoteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getQuoteItems(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getQuoteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateQuoteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteQuoteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Actions
  async approveQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async reviseQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async acceptQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async rejectQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async cancelQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async expireQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async exportPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Relations
  async setOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async setJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = "";
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
