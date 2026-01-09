/* eslint-disable node/prefer-global/process */
import logger from "./logger";
import { prisma } from "./prisma";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      responseTime?: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
  };
}

class HealthService {
  private startTime = Date.now();

  async isReady(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }
    catch (err) {
      logger.error("health.db_check_failed", { err });
      return false;
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Check database
    let dbStatus: "up" | "down" = "down";
    let dbResponseTime: number | undefined;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = "up";
    }
    catch (err) {
      logger.error("health.db_check_failed", { err });
    }

    // Get memory usage
    const memUsage = process.memoryUsage();

    const checks = {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      },
    };

    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (dbStatus === "down") {
      status = "unhealthy";
    }

    return {
      status,
      timestamp,
      uptime,
      checks,
    };
  }
}

export const healthService = new HealthService();
