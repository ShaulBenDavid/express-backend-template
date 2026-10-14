import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../../config/env.js';
import { AppError } from '../../errors/AppError.js';
import type { JwtAccessPayload } from './auth.service.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; email: string; roles: Role[] };
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.roles.includes(Role.ADMIN)) {
    return next(new AppError('Forbidden', HttpStatusCode.FORBIDDEN));
  }
  next();
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(
      new AppError('Authorization header missing or malformed', HttpStatusCode.UNAUTHORIZED),
    );
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtAccessSecret, {
      algorithms: ['HS256'],
    }) as JwtAccessPayload;
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles };
    next();
  } catch {
    next(new AppError('Invalid or expired access token', HttpStatusCode.UNAUTHORIZED));
  }
}
