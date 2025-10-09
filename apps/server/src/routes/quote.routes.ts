import { Router } from "express";

import { quoteController } from "@/controllers";

const router = Router();

// Metrics
router.get("/metrics", quoteController.getMetrics);

// Quotes
router.post("/", quoteController.createQuote);
router.get("/", quoteController.getQuotes);
router.get("/:quoteId", quoteController.getQuote);
router.patch("/:quoteId", quoteController.updateQuote);
router.delete("/:quoteId", quoteController.deleteQuote);

// Revisions
router.post("/:quoteId/revisions", quoteController.createRevision);
router.get("/:quoteId/revisions", quoteController.getRevisions);
router.get("/:quoteId/revisions/:revisionId", quoteController.getRevision);

// Actions
router.post("/:quoteId/approve", quoteController.approveQuote);
router.post("/:quoteId/revise", quoteController.reviseQuote);
router.post("/:quoteId/accept", quoteController.acceptQuote);
router.post("/:quoteId/reject", quoteController.rejectQuote);
router.post("/:quoteId/send", quoteController.sendQuote);
router.get("/:quoteId/export/pdf", quoteController.exportPDF);

export default router;
