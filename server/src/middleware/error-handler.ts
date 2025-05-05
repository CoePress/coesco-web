import { error } from "@/utils/logger";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { method, url } = req;

  if (err instanceof AppError) {
    error(`[${method}] [${url}] [${err.statusCode}] ${err.message}`);

    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    message: err.message,
  });
};
