import "tsconfig-paths/register";
import http from "node:http";
import process from "node:process";

import app from "./app";
import { cacheService } from "./services/core";
import { env } from "./utils/env";
import { logger } from "./utils/logger";
import { prisma } from "./utils/prisma";

const server = http.createServer(app);

async function main() {
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
