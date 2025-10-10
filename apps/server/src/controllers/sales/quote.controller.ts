import type { Request, Response } from "express";

import { asyncWrapper } from "@/utils";
import { quoteService } from "@/services";

export class QuoteController {
  createQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.createQuote(req.body);
    res.status(201).json(result);
  });

  getQuotes = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getAllQuotesWithLatestRevision(req.query);
    res.status(200).json(result);
  });

  getQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteWithDetails(req.params.quoteId);
    res.status(200).json(result);
  });

  updateQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.updateQuote(req.params.quoteId, req.body);
    res.status(200).json(result);
  });

  deleteQuote = asyncWrapper(async (req: Request, res: Response) => {
    await quoteService.deleteQuote(req.params.quoteId);
    res.status(204).send();
  });

  // Revision Management
  createRevision = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.createQuoteRevision(req.params.quoteId, req.body);
    res.status(201).json(result);
  });

  getRevisions = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteRevisions(req.params.quoteId);
    res.status(200).json(result);
  });

  getRevision = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteRevision(req.params.quoteId, req.params.revisionId);
    res.status(200).json(result);
  });

  // Actions
  approveQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.approveQuote(req.params.quoteId);
    res.status(200).json(result);
  });

  reviseQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.createQuoteRevision(req.params.quoteId, req.body);
    res.status(201).json(result);
  });

  acceptQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.acceptQuote(req.params.quoteId);
    res.status(200).json(result);
  });

  rejectQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.rejectQuote(req.params.quoteId);
    res.status(200).json(result);
  });

  sendQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.sendQuote(req.params.quoteId, req.body);
    res.status(200).json(result);
  });

  exportPDF = asyncWrapper(async (req: Request, res: Response) => {
    const pdfBuffer = await quoteService.exportQuotePDF(req.params.quoteId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=quote-${req.params.quoteId}.pdf`);
    res.send(pdfBuffer);
  });

  getMetrics = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteMetrics();
    res.status(200).json(result);
  });
}
