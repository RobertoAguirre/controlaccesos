export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({ error: `${campo} ya existe` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
  });
}
