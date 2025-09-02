import type { NextFunction, Request, Response } from "express";

import { asyncWrapper } from "@/utils";

export class QuoteController {
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
  approveQuote = asyncWrapper(async (_req: Request, _res: Response) => {
    const result = "Quote approved";
    return result;
  });

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
