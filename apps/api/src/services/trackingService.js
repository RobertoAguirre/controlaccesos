import { Dispositivo } from '../models/Dispositivo.js';
import { Geocerca } from '../models/Geocerca.js';
import { EventoGeocerca } from '../models/EventoGeocerca.js';
import { puntoEnGeocerca } from '../utils/geo.js';

/**
 * Actualiza ubicación de un dispositivo, detecta entradas/salidas
 * de geocercas y emite eventos por Socket.io.
 */
export async function procesarUbicacion({
  identificador,
  lat,
  lng,
  accuracy = null,
  heading = null,
  speed = null,
  io = null,
}) {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    throw new Error('lat y lng deben ser números válidos');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Coordenadas fuera de rango');
  }

  const dispositivo = await Dispositivo.findOne({
    identificador: String(identificador).toUpperCase(),
    activo: true,
  });

  if (!dispositivo) {
    throw new Error('Dispositivo no registrado o inactivo');
  }

  const geocercas = await Geocerca.find({ activa: true });
  const prevIds = new Set(
    (dispositivo.geocercasActuales || []).map((id) => id.toString())
  );
  const ahoraIds = new Set();

  for (const g of geocercas) {
    if (puntoEnGeocerca(lat, lng, g)) {
      ahoraIds.add(g._id.toString());
    }
  }

  const entradas = [...ahoraIds].filter((id) => !prevIds.has(id));
  const salidas = [...prevIds].filter((id) => !ahoraIds.has(id));

  dispositivo.ultimaUbicacion = {
    lat,
    lng,
    accuracy,
    heading,
    speed,
    updatedAt: new Date(),
  };
  dispositivo.enLinea = true;
  dispositivo.geocercasActuales = [...ahoraIds];
  await dispositivo.save();

  const eventos = [];

  for (const id of entradas) {
    const evento = await EventoGeocerca.create({
      dispositivo: dispositivo._id,
      geocerca: id,
      tipo: 'entrada',
      ubicacion: { lat, lng },
      fechaHora: new Date(),
    });
    eventos.push(evento);
  }

  for (const id of salidas) {
    const evento = await EventoGeocerca.create({
      dispositivo: dispositivo._id,
      geocerca: id,
      tipo: 'salida',
      ubicacion: { lat, lng },
      fechaHora: new Date(),
    });
    eventos.push(evento);
  }

  const dispositivoJson = dispositivo.toJSON();

  const eventosCompletos = await EventoGeocerca.find({
    _id: { $in: eventos.map((e) => e._id) },
  })
    .populate('dispositivo', 'nombre identificador persona color')
    .populate('geocerca', 'nombre color tipo');

  if (io) {
    io.to('monitores').emit('ubicacion:nueva', {
      dispositivo: dispositivoJson,
    });

    for (const evento of eventosCompletos) {
      io.to('monitores').emit('geocerca:evento', { evento });
    }
  }

  return {
    dispositivo: dispositivoJson,
    eventos: eventosCompletos,
  };
}

export async function marcarOffline(identificador) {
  const dispositivo = await Dispositivo.findOneAndUpdate(
    { identificador: String(identificador).toUpperCase() },
    { enLinea: false },
    { new: true }
  );
  return dispositivo;
}
