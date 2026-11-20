import { Router } from 'express';
import { z } from 'zod';
import { Dispositivo } from '../models/Dispositivo.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  nombre: z.string().min(2),
  identificador: z.string().min(2),
  persona: z.string().optional(),
  color: z.string().optional(),
  activo: z.boolean().optional(),
});

router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const dispositivos = await Dispositivo.find()
      .populate('geocercasActuales', 'nombre color')
      .sort({ nombre: 1 });
    res.json({ dispositivos });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dispositivo = await Dispositivo.findById(req.params.id).populate(
      'geocercasActuales',
      'nombre color'
    );
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    res.json({ dispositivo });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRoles('admin', 'operador'), async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const dispositivo = await Dispositivo.create(data);
    res.status(201).json({ dispositivo });
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
    const dispositivo = await Dispositivo.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    res.json({ dispositivo });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
    }
    next(err);
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res, next) => {
  try {
    const dispositivo = await Dispositivo.findByIdAndDelete(req.params.id);
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
