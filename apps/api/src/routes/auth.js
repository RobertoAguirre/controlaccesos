import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth, requireRoles, signToken } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['admin', 'operador', 'visor']).optional(),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select('+password');

    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
    }
    next(err);
  }
});

router.post(
  '/register',
  requireAuth,
  requireRoles('admin'),
  async (req, res, next) => {
    try {
      const data = registerSchema.parse(req.body);
      const exists = await User.findOne({ email: data.email });
      if (exists) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const user = await User.create(data);
      res.status(201).json({ user: user.toSafeJSON() });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: err.errors });
      }
      next(err);
    }
  }
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export default router;
