const tz = 'America/Mexico_City';

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: tz,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: tz,
    timeStyle: 'medium',
  }).format(new Date(value));
}
