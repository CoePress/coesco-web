import type { Request, Response } from "express";

import { quotingService } from "@/services";
import { asyncWrapper } from "@/utils";

export class QuoteController {
  createQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.createQuote(req.body);
    res.status(201).json(result);
  });

  getQuotes = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.getAllQuotesWithLatestRevision(req.query);
    res.status(200).json(result);
  });

  getQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.getQuoteWithDetails(req.params.id);
    res.status(200).json(result);
  });

  updateQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.updateQuote(req.params.id, req.body);
    res.status(200).json(result);
  });

  deleteQuote = asyncWrapper(async (req: Request, res: Response) => {
    await quotingService.deleteQuote(req.params.id);
    res.status(204).send();
  });

  // Revision Management
  createRevision = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.createQuoteRevision(req.params.id, req.body);
    res.status(201).json(result);
  });

  getRevisions = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.getQuoteRevisions(req.params.id);
    res.status(200).json(result);
  });

  getRevision = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.getQuoteRevision(req.params.id, req.params.revisionId);
    res.status(200).json(result);
  });

  // Actions
  approveQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.approveQuote(req.params.id);
    res.status(200).json(result);
  });

  reviseQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.createQuoteRevision(req.params.id, req.body);
    res.status(201).json(result);
  });

  acceptQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.acceptQuote(req.params.id);
    res.status(200).json(result);
  });

  rejectQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.rejectQuote(req.params.id);
    res.status(200).json(result);
  });

  sendQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.sendQuote(req.params.id, req.body);
    res.status(200).json(result);
  });

  exportPDF = asyncWrapper(async (req: Request, res: Response) => {
    const pdfBuffer = await quotingService.exportQuotePDF(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=quote-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  });

  getMetrics = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.getQuoteMetrics();
    res.status(200).json(result);
  });
}
