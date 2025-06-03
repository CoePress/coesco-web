import { salesController } from "@/controllers";
import { RequestHandler, Router } from "express";

const router = Router();

router.post("/sandbox", salesController.createSandboxQuote as RequestHandler);
router.get("/quote/:id", salesController.getQuoteOverview as RequestHandler);
router.get(
  "/journey/:id",
  salesController.getJourneyOverview as RequestHandler
);
router.get(
  "/company/:id",
  salesController.getCompanyOverview as RequestHandler
);
export default router;
