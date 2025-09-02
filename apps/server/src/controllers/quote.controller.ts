import type { Request, Response } from "express";

import { quotingService } from "@/services";
import { asyncWrapper } from "@/utils";

export class QuoteController {
  createQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.createQuote(req.body);
    res.status(201).json(result);
  });

  getQuotes = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.getAllQuotesWithLatestRevision(req.query);
    return result;
  });

  getQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.getQuoteWithDetails(req.params.id);
    return result;
  });

  updateQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.updateQuote(req.params.id, req.body);
    return result;
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

  getRevisions = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.getQuoteRevisions(req.params.id);
    return result;
  });

  // Actions
  approveQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.approveQuote(req.params.id);
    return result;
  });

  reviseQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quotingService.createQuoteRevision(req.params.id, req.body);
    res.status(201).json(result);
  });

  acceptQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.acceptQuote(req.params.id);
    return result;
  });

  rejectQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.rejectQuote(req.params.id);
    return result;
  });

  sendQuote = asyncWrapper(async (req: Request, _res: Response) => {
    const result = await quotingService.sendQuote(req.params.id, req.body);
    return result;
  });

  exportPDF = asyncWrapper(async (req: Request, res: Response) => {
    const pdfBuffer = await quotingService.exportQuotePDF(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=quote-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  });
}
