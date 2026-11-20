import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { createCorsOptions } from './config/cors.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import dispositivosRoutes from './routes/dispositivos.js';
import geocercasRoutes from './routes/geocercas.js';
import eventosRoutes from './routes/eventos.js';
import trackingRoutes from './routes/tracking.js';

/**
 * App Express compartida (servidor Node + Vercel Services).
 * `io` es opcional: en Vercel no hay Socket.io persistente.
 */
export function createApp(io = null) {
  const app = express();

  app.set('trust proxy', 1);
  if (io) app.set('io', io);

  app.use(async (_req, _res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      servicio: 'control-accesos-api',
      modo: 'tracking-geocercas',
      sockets: Boolean(io),
      hora: new Date().toISOString(),
      zona: process.env.TZ || 'America/Mexico_City',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dispositivos', dispositivosRoutes);
  app.use('/api/geocercas', geocercasRoutes);
  app.use('/api/eventos', eventosRoutes);
  app.use('/api/tracking', trackingRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
