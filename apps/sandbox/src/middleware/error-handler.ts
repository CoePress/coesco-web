import type { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

import { AppError, isAppError } from "../lib/errors";
import logger from "../lib/logger";

function isPrismaKnownRequestError(err: any): err is { name: string; code: string; meta?: any; message?: string } {
  return (
    err
    && typeof err === "object"
    && err.name === "PrismaClientKnownRequestError"
    && typeof err.code === "string"
  );
}

function mapPrismaKnown(err: { code: string; meta?: any; message?: string }) {
  switch (err.code) {
    case "P2025":
      return new AppError({
        status: 404,
        code: "NOT_FOUND",
        message: "Not found",
        details: { prisma: { code: err.code, meta: err.meta } },
      });
    case "P2002":
      return new AppError({
        status: 409,
        code: "CONFLICT",
        message: "Conflict",
        details: { prisma: { code: err.code, meta: err.meta } },
      });
    default:
      return new AppError({
        status: 400,
        code: "BAD_REQUEST",
        message: "Bad request",
        details: { prisma: { code: err.code, meta: err.meta } },
      });
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

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
        code: "BAD_REQUEST",
        status: 400,
        request_id: requestId,
        issues: err.issues,
      },
    });
  }

  // ✅ Prisma mapping that works even when instanceof fails
  if (isPrismaKnownRequestError(err)) {
    const appErr = mapPrismaKnown(err);

    logger.warn("request.prisma_error", {
      request_id: requestId,
      status: appErr.status,
      code: appErr.code,
      method: req.method,
      url: req.originalUrl,
      prisma_code: err.code,
      meta: err.meta,
    });

    return res.status(appErr.status).json({
      error: {
        message: appErr.message,
        code: appErr.code,
        status: appErr.status,
        request_id: requestId,
      },
    });
  }

  if (isAppError(err)) {
    logger.warn("request.app_error", {
      request_id: requestId,
      status: err.status,
      code: err.code,
      method: req.method,
      url: req.originalUrl,
      details: err.details,
    });

    return res.status(err.status).json({
      error: {
        message: err.message,
        code: err.code,
        status: err.status,
        request_id: requestId,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  logger.error("request.error", {
    request_id: requestId,
    status: 500,
    method: req.method,
    url: req.originalUrl,
    message: err?.message ?? String(err),
    stack: err?.stack,
  });

  return res.status(500).json({
    error: {
      message: "Internal Server Error",
      code: "INTERNAL",
      status: 500,
      request_id: requestId,
    },
  });
}
