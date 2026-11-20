import { Router } from 'express';
import { EventoGeocerca } from '../models/EventoGeocerca.js';
import { Dispositivo } from '../models/Dispositivo.js';
import { Geocerca } from '../models/Geocerca.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const filtro = {};
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.dispositivoId) filtro.dispositivo = req.query.dispositivoId;
    if (req.query.geocercaId) filtro.geocerca = req.query.geocercaId;

    const [eventos, total] = await Promise.all([
      EventoGeocerca.find(filtro)
        .sort({ fechaHora: -1 })
        .skip(skip)
        .limit(limit)
        .populate('dispositivo', 'nombre identificador persona color')
        .populate('geocerca', 'nombre color tipo'),
      EventoGeocerca.countDocuments(filtro),
    ]);

    res.json({
      eventos,
      paginacion: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [
      entradasHoy,
      salidasHoy,
      dispositivosActivos,
      enLinea,
      geocercasActivas,
    ] = await Promise.all([
      EventoGeocerca.countDocuments({
        fechaHora: { $gte: inicioHoy },
        tipo: 'entrada',
      }),
      EventoGeocerca.countDocuments({
        fechaHora: { $gte: inicioHoy },
        tipo: 'salida',
      }),
      Dispositivo.countDocuments({ activo: true }),
      Dispositivo.countDocuments({ enLinea: true }),
      Geocerca.countDocuments({ activa: true }),
    ]);

    res.json({
      stats: {
        entradasHoy,
        salidasHoy,
        dispositivosActivos,
        enLinea,
        geocercasActivas,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
