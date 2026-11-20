/**
 * CORS para web (Vercel) y clientes móviles (Flutter sin Origin).
 * CORS_ORIGIN: lista separada por comas. Usa * para permitir cualquier origen web.
 */
export function parseAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createCorsOptions() {
  const allowed = parseAllowedOrigins();
  const allowAll = allowed.includes('*');

  return {
    origin(origin, callback) {
      // Apps nativas / Postman / healthchecks suelen no enviar Origin
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);

      // Previews de Vercel: https://*.vercel.app
      if (
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) &&
        process.env.CORS_VERCEL_PREVIEWS !== 'false'
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

export function socketCorsOrigin() {
  const allowed = parseAllowedOrigins();
  if (allowed.includes('*')) return true;
  return allowed;
}
