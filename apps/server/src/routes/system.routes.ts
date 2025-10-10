import { Router } from "express";

const router = Router()

router.get("/health", (_req, res) => { res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }); });

router.post("/bugs", systemController.sendBugReport);

export default router