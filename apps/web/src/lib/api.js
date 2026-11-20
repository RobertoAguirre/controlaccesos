const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('ca_token');
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Error en la solicitud');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    api('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => api('/api/auth/me'),
};

export const dispositivosApi = {
  list: () => api('/api/dispositivos'),
  create: (body) => api('/api/dispositivos', { method: 'POST', body }),
  update: (id, body) => api(`/api/dispositivos/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/api/dispositivos/${id}`, { method: 'DELETE' }),
};

export const geocercasApi = {
  list: () => api('/api/geocercas'),
  create: (body) => api('/api/geocercas', { method: 'POST', body }),
  update: (id, body) => api(`/api/geocercas/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/api/geocercas/${id}`, { method: 'DELETE' }),
};

export const eventosApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api(`/api/eventos${qs ? `?${qs}` : ''}`);
  },
  stats: () => api('/api/eventos/stats'),
};

/** REST de ubicación (móvil / Vercel sin sockets) */
export const trackingApi = {
  ubicacion: (body) =>
    api('/api/tracking/ubicacion', { method: 'POST', body }),
};
