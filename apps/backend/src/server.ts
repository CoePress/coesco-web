import "tsconfig-paths/register";
import process from "node:process";

import { server } from "./app";
import { env } from "./config/env";
import { initializeServices } from "./services";
import { cacheService } from "./services/core";
import { logger } from "./utils/logger";
import { prisma } from "./utils/prisma";

async function main() {
  initializeServices();
  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

main().catch(handleFatal);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", handleFatal);
process.on("unhandledRejection", handleFatal);

async function shutdown() {
  logger.warn("\nShutting down gracefully...");
  server.close(() => {
    logger.warn("HTTP server closed.");
  });
  await prisma.$disconnect();
  await cacheService.stop();
  process.exit(0);
}

async function handleFatal(err: unknown) {
  logger.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
}
