import { Router } from "express";
import { performanceController } from "@/controllers";

const router = Router();

router.get("/", performanceController.getPerformanceSheets);
router.get("/:id", performanceController.getPerformanceSheet);
router.post("/", performanceController.createPerformanceSheet);
router.put("/:id", performanceController.updatePerformanceSheet);
router.delete("/:id", performanceController.deletePerformanceSheet);

export default router;
