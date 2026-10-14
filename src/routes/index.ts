import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/env.js';
import { healthRouter } from '../modules/health/health.router.js';
import { authRouter } from '../modules/auth/auth.router.js';
import { usersRouter } from '../modules/users/users.router.js';
import { booksRouter } from '../modules/books/books.router.js';

export const rootRouter = Router();

rootRouter.use(healthRouter);

// Keyed by (client, route group) so a burst on one endpoint can't exhaust the budget for others.
const routeRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // ipKeyGenerator normalizes IPv6 to its subnet so clients can't rotate addresses to bypass the limit.
  keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:${req.baseUrl}`,
});

// Stricter bucket for auth to slow down brute-force attempts.
const authRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

rootRouter.use('/api/v1/auth', authRateLimiter);

const routeMounts: [string, Router][] = [
  ['/api/v1/auth', authRouter],
  ['/api/v1/users', usersRouter],
  ['/api/v1/books', booksRouter],
];

for (const [path, router] of routeMounts) {
  rootRouter.use(path, routeRateLimiter, router);
}
