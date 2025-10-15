import { Router } from "express";

import { bugReportingController } from "@/controllers";

const router = Router();

router.get("/health", (_req, res) => { res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }); });

router.post("/bugs", bugReportingController.sendBugReport);

export default router;
