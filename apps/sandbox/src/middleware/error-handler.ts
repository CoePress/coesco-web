import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger from "../lib/logger";

function isHttpError(err: any): err is { status: number; message: string } {
  return err && typeof err === "object" && typeof err.status === "number";
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  // --- Zod validation errors -> 400
  if (err instanceof ZodError) {
    logger.warn("request.validation_error", {
      request_id: requestId,
      status: 400,
      method: req.method,
      url: req.originalUrl,
      issues: err.issues,
    });

    return res.status(400).json({
      error: {
        message: "Validation failed",
        status: 400,
        request_id: requestId,
        issues: err.issues,
      },
    });
  }

  // --- Prisma errors (optional but recommended)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = unique constraint
    const status =
      err.code === "P2002" ? 409 :
      err.code === "P2025" ? 404 :
      400;

    logger.warn("request.prisma_error", {
      request_id: requestId,
      status,
      method: req.method,
      url: req.originalUrl,
      code: err.code,
      message: err.message,
      meta: err.meta,
    });

    return res.status(status).json({
      error: {
        message:
          err.code === "P2002" ? "Conflict" :
          err.code === "P2025" ? "Not found" :
          "Bad request",
        status,
        request_id: requestId,
        code: err.code,
      },
    });
  }

  // --- Existing behavior for everything else
  const status = isHttpError(err) ? err.status : 500;

  logger.error("request.error", {
    request_id: requestId,
    status,
    method: req.method,
    url: req.originalUrl,
    message: err?.message ?? String(err),
    stack: err?.stack,
  });

  return res.status(status).json({
    error: {
      message: status === 500 ? "Internal Server Error" : (err?.message ?? "Error"),
      status,
      request_id: requestId,
    },
  });
}
