import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger from "../lib/logger";
import { AppError, isAppError } from "../lib/errors";

function mapPrismaKnownError(err: Prisma.PrismaClientKnownRequestError): AppError {
  // Expand as you see patterns in your app
  switch (err.code) {
    case "P2002": // unique constraint
      return new AppError({
        status: 409,
        code: "CONFLICT",
        message: "Conflict",
        details: { prisma: { code: err.code, meta: err.meta } },
        expose: true,
      });

    case "P2025": // record not found
      return new AppError({
        status: 404,
        code: "NOT_FOUND",
        message: "Not found",
        details: { prisma: { code: err.code, meta: err.meta } },
        expose: true,
      });

    default:
      return new AppError({
        status: 400,
        code: "BAD_REQUEST",
        message: "Bad request",
        details: { prisma: { code: err.code, meta: err.meta } },
        expose: true,
      });
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  // Zod -> AppError(400)
  if (err instanceof ZodError) {
    const appErr = new AppError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      details: { issues: err.issues },
      expose: true,
    });

    logger.warn("request.validation_error", {
      request_id: requestId,
      status: appErr.status,
      code: appErr.code,
      method: req.method,
      url: req.originalUrl,
      details: appErr.details,
    });

    return res.status(appErr.status).json({
      error: {
        message: appErr.message,
        code: appErr.code,
        status: appErr.status,
        request_id: requestId,
        ...(appErr.details ? appErr.details : null),
      },
    });
  }

  // Prisma -> AppError(mapped)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appErr = mapPrismaKnownError(err);

    logger.warn("request.prisma_error", {
      request_id: requestId,
      status: appErr.status,
      code: appErr.code,
      method: req.method,
      url: req.originalUrl,
      details: appErr.details,
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

  // Your reusable AppError
  if (isAppError(err)) {
    const appErr = err;

    logger.warn("request.app_error", {
      request_id: requestId,
      status: appErr.status,
      code: appErr.code,
      method: req.method,
      url: req.originalUrl,
      details: appErr.details,
    });

    return res.status(appErr.status).json({
      error: {
        message: appErr.message,
        code: appErr.code,
        status: appErr.status,
        request_id: requestId,
        ...(appErr.details ? { details: appErr.details } : {}),
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
