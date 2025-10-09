import { Router } from "express";

import { systemController } from "@/controllers";
import { protect } from "@/middleware/auth.middleware";

const router = Router();

router.get("/health", (_req, res) => { res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }); });
router.use(protect);
router.get("/logs", systemController.getLogFiles);
router.get("/logs/:file", systemController.getLogFile);
router.post("/agent", systemController.messageAgent);
router.post("/bug-report", systemController.sendBugReport);

export default router;
