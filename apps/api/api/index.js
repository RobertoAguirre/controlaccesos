/**
 * Entrypoint Express para Vercel Services (`framework: "express"`).
 * El path público llega intacto: /api/health → app.get('/api/health').
 *
 * Socket.io no aplica en este runtime serverless; usar
 * POST /api/tracking/ubicacion desde Flutter.
 */
import { createApp } from '../src/app.js';

export default createApp(null);
