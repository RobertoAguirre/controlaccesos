/** Distancia en metros entre dos puntos (Haversine). */
export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Ray casting: coordenadas de polígono en formato [lng, lat][].
 */
export function puntoEnPoligono(lat, lng, coordenadas) {
  if (!coordenadas || coordenadas.length < 3) return false;

  let dentro = false;
  for (let i = 0, j = coordenadas.length - 1; i < coordenadas.length; j = i++) {
    const [xi, yi] = coordenadas[i]; // lng, lat
    const [xj, yj] = coordenadas[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) dentro = !dentro;
  }
  return dentro;
}

export function puntoEnGeocerca(lat, lng, geocerca) {
  if (!geocerca?.activa) return false;

  if (geocerca.tipo === 'circle') {
    const [clng, clat] = geocerca.coordenadas[0] || [];
    if (clat == null || clng == null || !geocerca.radioMetros) return false;
    return distanciaMetros(lat, lng, clat, clng) <= geocerca.radioMetros;
  }

  return puntoEnPoligono(lat, lng, geocerca.coordenadas);
}
