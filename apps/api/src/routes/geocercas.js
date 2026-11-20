import { Router } from 'express';
import { z } from 'zod';
import { Geocerca } from '../models/Geocerca.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  tipo: z.enum(['polygon', 'circle']).optional(),
  coordenadas: z.array(z.tuple([z.number(), z.number()])).min(1),
  radioMetros: z.number().positive().nullable().optional(),
  activa: z.boolean().optional(),
});

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const geocercas = await Geocerca.find().sort({ nombre: 1 });
    res.json({ geocercas });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRoles('admin', 'operador'), async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    if ((data.tipo || 'polygon') === 'polygon' && data.coordenadas.length < 3) {
      return res.status(400).json({ error: 'Un polígono necesita al menos 3 puntos' });
    }
    if (data.tipo === 'circle' && (!data.radioMetros || data.coordenadas.length < 1)) {
      return res.status(400).json({ error: 'Un círculo necesita centro y radioMetros' });
    }
    const geocerca = await Geocerca.create(data);
    const io = req.app.get('io');
    if (io) io.to('monitores').emit('geocerca:actualizada', { geocerca, accion: 'crear' });
    res.status(201).json({ geocerca });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
    }
    next(err);
  }
});

router.put('/:id', requireRoles('admin', 'operador'), async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const geocerca = await Geocerca.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!geocerca) {
      return res.status(404).json({ error: 'Geocerca no encontrada' });
    }
    const io = req.app.get('io');
    if (io) io.to('monitores').emit('geocerca:actualizada', { geocerca, accion: 'actualizar' });
    res.json({ geocerca });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
    }
    next(err);
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const geocerca = await Geocerca.findByIdAndDelete(req.params.id);
    if (!geocerca) {
      return res.status(404).json({ error: 'Geocerca no encontrada' });
    }
    const io = req.app.get('io');
    if (io) {
      io.to('monitores').emit('geocerca:actualizada', {
        geocerca: { id: req.params.id },
        accion: 'eliminar',
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
