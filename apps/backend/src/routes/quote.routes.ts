import { Router } from "express";

import { quoteController } from "@/controllers";

const router = Router();

// Quotes
router.post("/", quoteController.createQuote);
router.get("/", quoteController.getQuotes);
router.get("/:quoteId", quoteController.getQuote);
router.patch("/:quoteId", quoteController.updateQuote);
router.delete("/:quoteId", quoteController.deleteQuote);

// Quote Items
router.post("/:quoteId/items", quoteController.createQuoteItem);
router.get("/:quoteId/items", quoteController.getQuoteItems);
router.get("/:quoteId/items/:quoteItemId", quoteController.getQuoteItem);
router.patch("/:quoteId/items/:quoteItemId", quoteController.updateQuoteItem);
router.delete("/:quoteId/items/:quoteItemId", quoteController.deleteQuoteItem);

// Actions
router.post("/:quoteId/approve", quoteController.approveQuote);
router.post("/:quoteId/revise", quoteController.reviseQuote);
router.post("/:quoteId/accept", quoteController.acceptQuote);
router.post("/:quoteId/reject", quoteController.rejectQuote);
router.post("/:quoteId/cancel", quoteController.cancelQuote);
router.post("/:quoteId/expire", quoteController.expireQuote);
router.post("/:quoteId/send", quoteController.sendQuote);
router.get("/:quoteId/pdf", quoteController.exportPDF);

// Relations
router.patch("/:quoteId/owner", quoteController.setOwner);
router.patch("/:quoteId/journey", quoteController.setJourney);

export default router;
