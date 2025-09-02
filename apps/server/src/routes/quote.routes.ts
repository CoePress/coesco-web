import { Router } from "express";

import { quoteController } from "@/controllers";

const router = Router();

// Quotes
router.post("/", quoteController.createQuote);
router.get("/", quoteController.getQuotes);
router.get("/:id", quoteController.getQuote);
router.patch("/:id", quoteController.updateQuote);
router.delete("/:id", quoteController.deleteQuote);

// Revisions
router.post("/:id/revisions", quoteController.createRevision);
router.get("/:id/revisions", quoteController.getRevisions);
router.get("/:id/revisions/:revisionId", quoteController.getRevision);

// Actions
router.post("/:id/approve", quoteController.approveQuote);
router.post("/:id/revise", quoteController.reviseQuote);
router.post("/:id/accept", quoteController.acceptQuote);
router.post("/:id/reject", quoteController.rejectQuote);
router.post("/:id/send", quoteController.sendQuote);
router.get("/:id/export/pdf", quoteController.exportPDF);

export default router;
