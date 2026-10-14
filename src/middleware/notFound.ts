import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { HttpStatusCode } from '../utils/httpStatusCodes.js';

export function notFound(req: Request, _res: Response): never {
  throw new AppError(`Route ${req.method} ${req.originalUrl} not found`, HttpStatusCode.NOT_FOUND);
}
