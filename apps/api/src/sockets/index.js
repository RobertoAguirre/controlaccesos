import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Dispositivo } from '../models/Dispositivo.js';
import { procesarUbicacion, marcarOffline } from '../services/trackingService.js';

/**
 * Socket.io
 * - cliente=web     → monitor del mapa
 * - cliente=movil   → dispositivo Flutter (futuro)
 *
 * Eventos:
 *  ubicacion:actualizar  (móvil → server)
 *  ubicacion:nueva       (server → monitores)
 *  geocerca:evento       (server → monitores)
 *  geocerca:actualizada  (server → monitores)
 *  sistema:ping
 */
export function setupSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token || null;

      if (!token) {
        return next(new Error('No autorizado'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);

      if (!user || !user.activo) {
        return next(new Error('Sesión inválida'));
      }

      socket.user = user;
      socket.cliente = socket.handshake.query?.cliente || 'web';
      socket.deviceId = socket.handshake.query?.deviceId || null;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(
      `Socket: ${socket.user.email} [${socket.cliente}]${
        socket.deviceId ? ` device=${socket.deviceId}` : ''
      }`
    );

    if (socket.cliente === 'web' || socket.cliente === 'monitor') {
      socket.join('monitores');
    }

    if (socket.deviceId) {
      await Dispositivo.findOneAndUpdate(
        { identificador: String(socket.deviceId).toUpperCase() },
        { enLinea: true }
      );
      io.to('monitores').emit('dispositivo:estado', {
        identificador: String(socket.deviceId).toUpperCase(),
        enLinea: true,
      });
    }

    socket.emit('sistema:conectado', {
      mensaje: 'Conectado al servidor de tracking',
      usuario: socket.user.toSafeJSON(),
      cliente: socket.cliente,
    });

    socket.on('sistema:ping', (cb) => {
      if (typeof cb === 'function') {
        cb({ ok: true, hora: new Date().toISOString() });
      }
    });

    // Ubicación desde móvil (o simulador web)
    socket.on('ubicacion:actualizar', async (payload, cb) => {
      try {
        const identificador =
          payload?.identificador || socket.deviceId || null;

        const resultado = await procesarUbicacion({
          identificador,
          lat: Number(payload?.lat),
          lng: Number(payload?.lng),
          accuracy: payload?.accuracy ?? null,
          heading: payload?.heading ?? null,
          speed: payload?.speed ?? null,
          io,
        });

        if (typeof cb === 'function') cb({ ok: true, ...resultado });
      } catch (err) {
        if (typeof cb === 'function') {
          cb({ ok: false, error: err.message || 'Error al procesar ubicación' });
        }
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Socket off: ${socket.user.email}`);
      if (socket.deviceId) {
        await marcarOffline(socket.deviceId);
        io.to('monitores').emit('dispositivo:estado', {
          identificador: String(socket.deviceId).toUpperCase(),
          enLinea: false,
        });
      }
    });
  });
}
