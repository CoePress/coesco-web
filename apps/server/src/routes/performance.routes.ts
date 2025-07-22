import { Router } from "express";
import { performanceController } from "@/controllers";

const router = Router();

// Performance Sheets
router.get("/sheets", performanceController.getPerformanceSheets);
router.get("/sheets/:id", performanceController.getPerformanceSheet);
router.post("/sheets", performanceController.createPerformanceSheet);
router.patch("/sheets/:id", performanceController.updatePerformanceSheet);
router.delete("/sheets/:id", performanceController.deletePerformanceSheet);

// Performance Sheet Versions
router.get("/versions", performanceController.getPerformanceSheetVersions);
router.get("/versions/:id", performanceController.getPerformanceSheetVersion);
router.post("/versions", performanceController.createPerformanceSheetVersion);
router.patch(
  "/versions/:id",
  performanceController.updatePerformanceSheetVersion
);
router.delete(
  "/versions/:id",
  performanceController.deletePerformanceSheetVersion
);

// Performance Sheet Links
router.get("/links", performanceController.getPerformanceSheetLinks);
router.get("/links/:id", performanceController.getPerformanceSheetLink);
router.post("/links", performanceController.createPerformanceSheetLink);
router.patch("/links/:id", performanceController.updatePerformanceSheetLink);
router.delete("/links/:id", performanceController.deletePerformanceSheetLink);

export default router;
