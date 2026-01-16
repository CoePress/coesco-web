import type { Request, Response } from "express";

import { QuoteRevisionStatus, QuoteStatus } from "@prisma/client";
import { z } from "zod";

import { quoteService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateQuoteSchema = z.object({
  journeyId: z.string().uuid("Invalid journey ID").optional(),
  year: z.string().min(1, "Year is required"),
  number: z.string().min(1, "Number is required"),
  rsmId: z.string().uuid("Invalid RSM ID").optional(),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  customerContactId: z.string().uuid("Invalid customer contact ID").optional(),
  customerAddressId: z.string().uuid("Invalid customer address ID").optional(),
  dealerId: z.string().uuid("Invalid dealer ID").optional(),
  dealerContactId: z.string().uuid("Invalid dealer contact ID").optional(),
  dealerAddressId: z.string().uuid("Invalid dealer address ID").optional(),
  priority: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
  legacy: z.record(z.any()).optional(),
});

const UpdateQuoteSchema = CreateQuoteSchema.partial();

const CreateQuoteRevisionSchema = z.object({
  revision: z.string().optional(),
  quoteDate: z.coerce.date().optional(),
  status: z.nativeEnum(QuoteRevisionStatus).optional(),
  approvedById: z.string().uuid("Invalid approver ID").optional(),
  sentById: z.string().uuid("Invalid sender ID").optional(),
});

const UpdateQuoteRevisionSchema = CreateQuoteRevisionSchema.partial();

const SendQuoteSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").optional(),
  message: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
});

const CreateQuoteItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID").optional(),
  configurationId: z.string().uuid("Invalid configuration ID").optional(),
  itemType: z.enum(["item", "configuration"]),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().optional(),
  discount: z.number().optional(),
  tax: z.number().optional(),
});

const UpdateQuoteItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().optional(),
  discount: z.number().optional(),
  tax: z.number().optional(),
  lineNumber: z.number().int().min(1).optional(),
});

const UpdateLineNumberSchema = z.object({
  lineNumber: z.number().int().min(1, "Line number must be at least 1"),
});

export class QuoteController {
  createQuote = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateQuoteSchema.parse(req.body);
    const result = await quoteService.createQuote(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getQuotes = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getAllQuotesWithLatestRevision(req.query);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteWithDetails(req.params.quoteId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateQuote = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateQuoteSchema.parse(req.body);
    const result = await quoteService.updateQuote(req.params.quoteId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteQuote = asyncWrapper(async (req: Request, res: Response) => {
    await quoteService.deleteQuote(req.params.quoteId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  // Revision Management
  createRevision = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateQuoteRevisionSchema.parse(req.body);
    const result = await quoteService.createQuoteRevision(req.params.quoteId, validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getRevisions = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteRevisions(req.params.quoteId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getRevision = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteRevision(req.params.quoteId, req.params.revisionId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateRevision = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateQuoteRevisionSchema.parse(req.body);
    const result = await quoteService.updateQuoteRevision(req.params.quoteId, req.params.revisionId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteRevision = asyncWrapper(async (req: Request, res: Response) => {
    await quoteService.deleteQuoteRevision(req.params.quoteId, req.params.revisionId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  // Actions
  approveQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.approveQuote(req.params.quoteId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  reviseQuote = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateQuoteRevisionSchema.parse(req.body);
    const result = await quoteService.createQuoteRevision(req.params.quoteId, validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  acceptQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.acceptQuote(req.params.quoteId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  rejectQuote = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.rejectQuote(req.params.quoteId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  sendQuote = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SendQuoteSchema.parse(req.body);
    const result = await quoteService.sendQuote(req.params.quoteId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  exportPDF = asyncWrapper(async (req: Request, res: Response) => {
    const pdfBuffer = await quoteService.exportQuotePDF(req.params.quoteId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=quote-${req.params.quoteId}.pdf`);
    res.send(pdfBuffer);
  });

  getMetrics = asyncWrapper(async (req: Request, res: Response) => {
    const result = await quoteService.getQuoteMetrics();
    res.status(HTTP_STATUS.OK).json(result);
  });

  // Quote Items
  createQuoteItem = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateQuoteItemSchema.parse(req.body);
    const result = await quoteService.createQuoteItem(req.params.quoteId, validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  updateQuoteItem = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateQuoteItemSchema.parse(req.body);
    const result = await quoteService.updateQuoteItem(req.params.itemId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateQuoteItemLineNumber = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateLineNumberSchema.parse(req.body);
    const result = await quoteService.updateQuoteItemLineNumber(req.params.itemId, validData.lineNumber);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteQuoteItem = asyncWrapper(async (req: Request, res: Response) => {
    await quoteService.deleteQuoteItem(req.params.itemId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
