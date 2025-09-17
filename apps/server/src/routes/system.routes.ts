import { Router } from "express";

import { protect } from "@/middleware/auth.middleware";

import { systemController } from "../controllers";

const router = Router();

router.get("/logs", protect, systemController.getLogFiles);

router.get("/logs/:file", protect, systemController.getLogFile);

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.post("/agent", systemController.messageAgent);

export default router;
