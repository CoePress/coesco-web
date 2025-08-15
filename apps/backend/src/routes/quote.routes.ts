import { Router } from "express";

import { quoteController } from "@/controllers";

const router = Router();

// Quotes
router.post("/quotes", quoteController.createQuote);
router.get("/quotes", quoteController.getQuotes);
router.get("/quotes/:quoteId", quoteController.getQuote);
router.patch("/quotes/:quoteId", quoteController.updateQuote);
router.delete("/quotes/:quoteId", quoteController.deleteQuote);

// Quote Items
router.post("/quotes/:quoteId/items", quoteController.createQuoteItem);
router.get("/quotes/:quoteId/items", quoteController.getQuoteItems);
router.get("/quotes/:quoteId/items/:quoteItemId", quoteController.getQuoteItem);
router.patch("/quotes/:quoteId/items/:quoteItemId", quoteController.updateQuoteItem);
router.delete("/quotes/:quoteId/items/:quoteItemId", quoteController.deleteQuoteItem);

// Actions
router.post("/quotes/:quoteId/approve", quoteController.approveQuote);
router.post("/quotes/:quoteId/revise", quoteController.reviseQuote);
router.post("/quotes/:quoteId/accept", quoteController.acceptQuote);
router.post("/quotes/:quoteId/reject", quoteController.rejectQuote);
router.post("/quotes/:quoteId/cancel", quoteController.cancelQuote);
router.post("/quotes/:quoteId/expire", quoteController.expireQuote);
router.post("/quotes/:quoteId/send", quoteController.sendQuote);
router.get("/quotes/:quoteId/pdf", quoteController.exportPDF);

// Relations
router.patch("/quotes/:quoteId/owner", quoteController.setOwner);
router.patch("/quotes/:quoteId/journey", quoteController.setJourney);

export default router;
