import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpStatusCode } from '../utils/httpStatusCodes.js';

type Target = 'body' | 'params' | 'query';

export const validate =
  (schema: z.ZodTypeAny, target: Target = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(HttpStatusCode.UNPROCESSABLE_ENTITY).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
      return;
    }
    req[target] = result.data as never;
    next();
  };
