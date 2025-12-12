import type { NextFunction, Request, Response } from "express";
import logger from "../lib/logger";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const requestId = (req as any).requestId;

  logger.error("request.error", {
    request_id: requestId,
    status,
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal Server Error" : err.message,
      status,
      request_id: requestId,
    },
  });
}
