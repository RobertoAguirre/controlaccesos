import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { procesarUbicacion } from '../services/trackingService.js';

const router = Router();

const ubicacionSchema = z.object({
  identificador: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

/**
 * REST para móviles (Flutter) y para API en Vercel serverless
 * donde Socket.io no está disponible de forma persistente.
 *
 * POST /api/tracking/ubicacion
 * Authorization: Bearer <jwt>
 */
router.post(
  '/ubicacion',
  requireAuth,
  requireRoles('admin', 'operador'),
  async (req, res, next) => {
    try {
      const data = ubicacionSchema.parse(req.body);
      const io = req.app.get('io') || null;

      const resultado = await procesarUbicacion({
        ...data,
        io,
      });

      res.json({ ok: true, ...resultado });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
      }
      if (err.message?.includes('Dispositivo no registrado')) {
        return res.status(404).json({ error: err.message });
      }
      next(err);
    }
  }
);

export default router;
