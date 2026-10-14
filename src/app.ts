import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { rootRouter } from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust Render's proxy so req.ip / req.secure reflect the real client, not the proxy.
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(hpp());
  // Rate limiting is applied per route group inside rootRouter (routes/index.ts),
  // not globally here — see that file for why.

  // Body parsing & cookie parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Routes
  app.use(rootRouter);

  // Error handling — must be last
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
