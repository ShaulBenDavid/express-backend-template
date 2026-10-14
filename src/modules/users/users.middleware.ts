import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../errors/AppError.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

export function validateCreateUser(req: Request, _res: Response, next: NextFunction): void {
  const { name, email } = req.body as { name?: unknown; email?: unknown };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('name is required', HttpStatusCode.BAD_REQUEST);
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('A valid email is required', HttpStatusCode.BAD_REQUEST);
  }

  next();
}
