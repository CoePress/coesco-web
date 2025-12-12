import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
};