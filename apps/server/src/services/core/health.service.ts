import process from "node:process";

import { cacheService } from "@/services";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    memory: CheckResult;
  };
}

interface CheckResult {
  status: "up" | "down" | "degraded";
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export class HealthService {
  async checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    }
    catch (error) {
      logger.error("Database health check failed", { error });
      return {
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - start,
      };
    }
  }

  async checkRedis(): Promise<CheckResult> {
    const start = Date.now();
    try {
      const testKey = "health-check";
      const testValue = "ok";

      await cacheService.set(testKey, testValue, 10);
      const result = await cacheService.get<string>(testKey);

      if (result !== testValue) {
        throw new Error("Redis read/write mismatch");
      }

      await cacheService.delete(testKey);

      return {
        status: "up",
        responseTime: Date.now() - start,
      };
    }
    catch (error) {
      logger.error("Redis health check failed", { error });
      return {
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - start,
      };
    }
  }

  async checkMemory(): Promise<CheckResult> {
    try {
      const used = process.memoryUsage();
      const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);

      const status = heapUsedPercent > 90 ? "degraded" : "up";
      const error = heapUsedPercent > 90
        ? `High memory usage: ${heapUsedPercent.toFixed(2)}%`
        : undefined;

      return {
        status,
        responseTime: 0,
        error,
        details: {
          heapUsedMB,
          heapTotalMB,
          heapUsedPercent: Number.parseFloat(heapUsedPercent.toFixed(2)),
          rssMB: Math.round(used.rss / 1024 / 1024),
        },
      };
    }
    catch (error) {
      logger.error("Memory health check failed", { error });
      return {
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
    ]);

    const checks = { database, redis, memory };
    const allUp = Object.values(checks).every(c => c.status === "up");
    const anyDown = Object.values(checks).some(c => c.status === "down");

    return {
      status: anyDown ? "unhealthy" : allUp ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      checks,
    };
  }

  async isReady(): Promise<boolean> {
    const status = await this.getHealthStatus();
    return status.status !== "unhealthy";
  }

  async isLive(): Promise<boolean> {
    return true;
  }
}

export const healthService = new HealthService();
