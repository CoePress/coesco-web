import "tsconfig-paths/register";
import process from "node:process";
import { seedDatabase } from "prisma/seed";

import { server } from "./app";
import { env } from "./config/env";
import { cacheService, initializeServices, legacyService } from "./services";
import { logger } from "./utils/logger";
import { prisma } from "./utils/prisma";

async function main() {
  await initializeServices();
  await seedDatabase();

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
  logger.warn("Shutting down gracefully...");
  server.close(() => {
    logger.warn("HTTP server closed.");
  });
  await prisma.$disconnect();
  await cacheService.stop();
  await legacyService.close();
  process.exit(0);
}

async function handleFatal(err: unknown) {
  logger.error("Fatal error:", err);
  await prisma.$disconnect();
  await cacheService.stop();
  await legacyService.close();
  process.exit(1);
}
