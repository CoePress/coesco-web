import { Router } from "express";

import { bugReportingController } from "@/controllers";
import { healthService } from "@/services";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health/ready", async (_req, res) => {
  try {
    const isReady = await healthService.isReady();
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
    });
  }
  catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

router.get("/health/status", async (_req, res) => {
  try {
    const status = await healthService.getHealthStatus();
    const httpCode = status.status === "healthy"
      ? 200
      : status.status === "degraded"
        ? 200
        : 503;

    res.status(httpCode).json(status);
  }
  catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Failed to retrieve health status",
    });
  }
});

router.post("/bugs", bugReportingController.sendBugReport);

export default router;
