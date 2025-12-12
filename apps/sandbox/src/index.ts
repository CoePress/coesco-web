import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import axios from 'axios';
import compression from "compression";
import cookieParser from "cookie-parser";
import logger from './lib/logger';
import env from './lib/env';
import router from './routes';
import { errorHandler } from './middleware/error-handler';
import { startCron } from './lib/cron';
import { jobs } from './jobs';
import { requestId } from './middleware/request-id';
import { prisma } from './lib/prisma';

const app = express();

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

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/v1', router);

app.use((req: Request, _res: Response, next: NextFunction) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`) as any;
  err.status = 404;
  next(err);
});

app.use(errorHandler);

async function setupShutdown() {
  const shutdown = async (signal: string) => {
    logger.info("shutdown.start", { signal });

    try {
      await prisma.$disconnect();
      logger.info("shutdown.done", { signal });
      process.exit(0);
    } catch (err) {
      logger.error("shutdown.failed", { signal, err });
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

async function main() { 
  await prisma.$queryRaw`SELECT 1`;

  app.listen(env.PORT, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    
    console.log(`Server is running on port ${env.PORT}`);
    setupShutdown();
    startCron(jobs);
  });
}

main().catch((err) => {
  logger.error("startup.failed", { err });
  process.exit(1);
});