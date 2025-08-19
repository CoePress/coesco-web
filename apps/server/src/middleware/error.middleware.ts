// middleware/error.middleware.ts
import type { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

import { __prod__ } from "@/config/env";

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
  constructor(message: string) { super(message, 403); }
}
export class InternalServerError extends AppError {
  constructor(message: string) { super(message, 500); }
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent)
    return next(err as any);

  let statusCode = 500;
  let errorMessage: string | Array<{ field: string; message: string }>;
  let stack: string | undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    errorMessage = err.errors.map(e => ({ field: e.path.join("."), message: e.message }));
  }
  else if (err instanceof AppError) {
    statusCode = err.status;
    errorMessage = err.message;
  }
  else if (err instanceof Error) {
    errorMessage = err.message || "Internal Server Error";
  }
  else {
    errorMessage = "Internal Server Error";
  }

  if (!__prod__ && err instanceof Error && err.stack) {
    stack = err.stack
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("at "))
      .map(line => line.replace(/at\s+/, ""))
      .join("\n");
  }

  const responseBody = { error: errorMessage, ...(stack && { details: stack }) };

  res
    .status(statusCode)
    .type("application/json")
    .json(responseBody);
}
