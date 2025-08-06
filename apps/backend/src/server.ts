import http from "node:http";
import process from "node:process";

import app from "./app";
import { env } from "./utils/env";
import { prisma } from "./utils/prisma";

const PORT = env.PORT;

const server = http.createServer(app);

async function main() {
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(handleFatal);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", handleFatal);
process.on("unhandledRejection", handleFatal);

async function shutdown() {
  console.warn("\nShutting down gracefully...");
  server.close(() => {
    console.warn("HTTP server closed.");
  });
  await prisma.$disconnect();
  process.exit(0);
}

async function handleFatal(err: unknown) {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
}
