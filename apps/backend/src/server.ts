import app from "./app";
import http from "http";
import { prisma } from "./utils/prisma";
import { env } from "./utils/env";

const PORT = env.PORT;

const server = http.createServer(app);

async function main() {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(handleFatal);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", handleFatal);
process.on("unhandledRejection", handleFatal);

async function shutdown() {
  console.log("\nShutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  await prisma.$disconnect();
  process.exit(0);
}

async function handleFatal(err: unknown) {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
}
