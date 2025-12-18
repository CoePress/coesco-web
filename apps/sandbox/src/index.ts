/* eslint-disable node/prefer-global/process */
// src/index.ts
import type { NextFunction, Request, Response } from "express";

import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import http from "node:http";

import { jobs } from "./jobs";
import { startCron } from "./lib/cron";
import env from "./lib/env";
import logger from "./lib/logger";
import { syncMicrosoftUsers } from "./lib/microsoft";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/error-handler";
import { requestId } from "./middleware/request-id";
import router from "./routes";
import { seedUsers } from "./utils/seed-users";
import { createSocketServer } from "./ws";

const app = express();
const server = http.createServer(app);

/* ----------------------------- middleware ----------------------------- */

const morganMiddleware = morgan(
  (tokens, req, res) =>
    JSON.stringify({
      request_id: (req as any).requestId,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) ?? "0"),
      content_length: tokens.res(req, res, "content-length"),
      response_time: Number.parseFloat(tokens["response-time"](req, res) ?? "0"),
    }),
  {
    stream: {
      write: (message) => {
        logger.http("request", JSON.parse(message));
      },
    },
  },
);

app.use(compression());
app.use(cookieParser());
app.use(express.json());

app.use(requestId);
app.use(morganMiddleware);

/* -------------------------------- routes ------------------------------ */

app.get("/health", async (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/v1", router);

app.use((req: Request, _res: Response, next: NextFunction) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as any;
  err.status = 404;
  next(err);
});

app.use(errorHandler);

/* --------------------------- graceful shutdown -------------------------- */

function setupShutdown() {
  const shutdown = async (signal: string) => {
    logger.info("shutdown.start", { signal });

    try {
      await prisma.$disconnect();
      logger.info("shutdown.done", { signal });
      process.exit(0);
    }
    catch (err) {
      logger.error("shutdown.failed", { signal, err });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

/* --------------------------------- main -------------------------------- */

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  await seedUsers(prisma, [
    { username: "admin", password: "admin123", isActive: true },
  ]);

  await syncMicrosoftUsers();

  createSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info("server.started", { port: env.PORT });
    setupShutdown();
    startCron(jobs);
  });
}

main().catch((err) => {
  logger.error("startup.failed", { err });
  process.exit(1);
});
