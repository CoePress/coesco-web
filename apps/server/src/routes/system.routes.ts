import { Router } from "express";

import { systemController } from "../controllers";

const router = Router();

router.get("/logs", systemController.getLogFiles);

router.get("/logs/:file", systemController.getLogFile);

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
