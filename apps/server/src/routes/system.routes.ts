import { Router } from "express";

import { bugReportingController } from "@/controllers";
import { healthService } from "@/services";
import { queryMetrics } from "@/utils/prisma";

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
  catch {
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
  catch {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Failed to retrieve health status",
    });
  }
});

router.post("/bugs", bugReportingController.sendBugReport);
router.get("/bugs/my-reports", bugReportingController.getMyBugReports);

router.get("/metrics/queries", (_req, res) => {
  res.status(200).json({
    ...queryMetrics.getSummary(),
    timestamp: new Date().toISOString(),
  });
});

router.post("/metrics/queries/reset", (_req, res) => {
  queryMetrics.reset();
  res.status(200).json({
    message: "Query metrics reset",
    timestamp: new Date().toISOString(),
  });
});

export default router;
