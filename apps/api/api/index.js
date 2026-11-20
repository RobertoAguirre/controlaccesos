/**
 * Entrypoint serverless para Vercel.
 * Expone la API REST (auth, dispositivos, geocercas, eventos, tracking).
 *
 * Nota: Socket.io requiere proceso Node persistente.
 * En Vercel los móviles deben usar POST /api/tracking/ubicacion.
 */
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';

const app = createApp(null);

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Error interno' }));
  }
}
