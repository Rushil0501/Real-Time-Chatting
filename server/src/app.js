import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import channelRoutes from './routes/channel.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import pushRoutes from './routes/push.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Hosted platforms (Render, Railway, etc.) terminate TLS at a proxy; without
  // this, req.ip is the proxy's address and express-rate-limit rejects the
  // X-Forwarded-For header it receives.
  app.set('trust proxy', 1);

  // Default CORP (same-origin) blocks the client (different port/origin in dev,
  // possibly a different origin in prod) from loading <img>/<video> uploads via
  // plain no-cors requests. This API is meant to be consumed cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Static file serving for locally-stored uploads (see storageService).
  app.use('/uploads', express.static(path.join(__dirname, '..', env.UPLOAD_DIR)));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', apiLimiter, userRoutes);
  app.use('/api/channels', apiLimiter, channelRoutes);
  app.use('/api/upload', apiLimiter, uploadRoutes);
  app.use('/api/push', apiLimiter, pushRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
