import { __dev__ } from "@/config/config";
import { logger } from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  let statusCode = 500;
  let errorMessage: string | Array<{ field: string; message: string }> =
    err.message;
  let errorDetails = __dev__
    ? {
        stack: err.stack
          ?.split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("at "))
          .map((line) => line.replace(/at\s+/, ""))
          .join("\n"),
      }
    : undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    errorMessage = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.status;
    errorMessage = err.message;
  }

  const responseBody = {
    error: errorMessage,
    ...(errorDetails && { details: errorDetails }),
  };

  res.status(statusCode).json(responseBody);
};
