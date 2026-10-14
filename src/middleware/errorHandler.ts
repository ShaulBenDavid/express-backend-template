import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/env.js';
import { HttpStatusCode } from '../utils/httpStatusCodes.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  console.error('[Unhandled Error]', err);

  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message:
      config.nodeEnv === 'development'
        ? err instanceof Error
          ? err.message
          : String(err)
        : 'Internal Server Error',
    ...(config.nodeEnv === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
}
