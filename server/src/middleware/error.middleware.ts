import { logger } from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.name}: ${err.message}`);

  let statusCode = 500;
  let errorMessage: string | Array<{ field: string; message: string }> =
    err.message;

  if (err instanceof ZodError) {
    statusCode = 400;
    errorMessage = err.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
  } else if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
  } else if (err.name === "ForbiddenError") {
    statusCode = 403;
  } else if (err.name === "NotFoundError") {
    statusCode = 404;
  }

  res.status(statusCode).json({
    error: errorMessage,
  });
  return;
};
