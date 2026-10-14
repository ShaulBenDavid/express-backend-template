import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { HttpStatusCode } from '../../utils/httpStatusCodes.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  res.status(HttpStatusCode.OK).json({ status: 'ok' });
});
