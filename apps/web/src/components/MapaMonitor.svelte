<script>
  import { onDestroy, onMount } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { dispositivosApi, eventosApi, geocercasApi } from '../lib/api.js';
  import { getSocket } from '../lib/socket.js';
  import { formatDateTime } from '../lib/format.js';
  import { MAP_CENTER, MAP_ZOOM, TILE_ATTR, TILE_URL } from '../lib/mapDefaults.js';

  let mapEl = $state(null);
  let map = null;
  let markersLayer = null;
  let geofenceLayer = null;
  let draftLayer = null;

  let dispositivos = $state([]);
  let geocercas = $state([]);
  let eventos = $state([]);
  let live = $state(false);
  let error = $state('');
  let modoDibujo = $state(false);
  let draftPoints = $state([]);
  let nombreGeocerca = $state('');
  let colorGeocerca = $state('#2dd4a8');
  let simulando = $state(false);
  let simTimer = null;
  let geoStatus = $state(''); // ubicando | ok | denegado | error | no-soportado
  let yoMarker = null;
  let yoAccuracy = null;

  const markerById = new Map();

  function ubicarNavegador() {
    if (!map || !navigator.geolocation) {
      geoStatus = 'no-soportado';
      return;
    }

    geoStatus = 'ubicando';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!map) return;
        const { latitude, longitude, accuracy } = pos.coords;
        map.setView([latitude, longitude], Math.max(MAP_ZOOM, 15));

        if (yoMarker) {
          yoMarker.setLatLng([latitude, longitude]);
        } else {
          yoMarker = L.circleMarker([latitude, longitude], {
            radius: 9,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.9,
            weight: 2,
          })
            .bindPopup('Tu ubicación')
            .addTo(map);
        }

        if (yoAccuracy) {
          map.removeLayer(yoAccuracy);
          yoAccuracy = null;
        }
        if (accuracy && accuracy > 0) {
          yoAccuracy = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map);
        }

        geoStatus = 'ok';
      },
      (err) => {
        geoStatus = err.code === 1 ? 'denegado' : 'error';
        console.warn('Geolocalización:', err.message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  function deviceKey(d) {
    return d.identificador || d.id;
  }

  function upsertMarker(dispositivo) {
    if (!markersLayer || !dispositivo?.ultimaUbicacion) return;

    const { lat, lng } = dispositivo.ultimaUbicacion;
    const key = deviceKey(dispositivo);
    const html = `
      <div class="dev-marker" style="--c:${dispositivo.color || '#2dd4a8'}">
        <span></span>
      </div>
    `;
    const icon = L.divIcon({
      className: 'dev-icon',
      html,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const label = `${dispositivo.persona || dispositivo.nombre}<br/><small>${dispositivo.identificador}</small>`;

    if (markerById.has(key)) {
      const m = markerById.get(key);
      m.setLatLng([lat, lng]);
      m.setIcon(icon);
      m.bindPopup(label);
    } else {
      const m = L.marker([lat, lng], { icon }).bindPopup(label);
      m.addTo(markersLayer);
      markerById.set(key, m);
    }
  }

  function renderGeocercas() {
    if (!geofenceLayer) return;
    geofenceLayer.clearLayers();

    for (const g of geocercas) {
      if (!g.activa) continue;
      const color = g.color || '#2dd4a8';

      if (g.tipo === 'circle') {
        const [lng, lat] = g.coordenadas[0] || [];
        if (lat == null) continue;
        L.circle([lat, lng], {
          radius: g.radioMetros || 100,
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 2,
        })
          .bindPopup(`<strong>${g.nombre}</strong>`)
          .addTo(geofenceLayer);
      } else {
        const latlngs = (g.coordenadas || []).map(([lng, lat]) => [lat, lng]);
        if (latlngs.length < 3) continue;
        L.polygon(latlngs, {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 2,
        })
          .bindPopup(`<strong>${g.nombre}</strong>`)
          .addTo(geofenceLayer);
      }
    }
  }

  function renderDraft() {
    if (!draftLayer) return;
    draftLayer.clearLayers();
    if (draftPoints.length === 0) return;

    for (const p of draftPoints) {
      L.circleMarker(p, {
        radius: 5,
        color: colorGeocerca,
        fillColor: colorGeocerca,
        fillOpacity: 1,
      }).addTo(draftLayer);
    }

    if (draftPoints.length >= 2) {
      L.polyline(draftPoints, { color: colorGeocerca, dashArray: '6 6' }).addTo(
        draftLayer
      );
    }

    if (draftPoints.length >= 3) {
      L.polygon(draftPoints, {
        color: colorGeocerca,
        fillColor: colorGeocerca,
        fillOpacity: 0.12,
        dashArray: '4 4',
      }).addTo(draftLayer);
    }
  }

  async function loadAll() {
    try {
      const [d, g, e] = await Promise.all([
        dispositivosApi.list(),
        geocercasApi.list(),
        eventosApi.list({ limit: 20 }),
      ]);
      dispositivos = d.dispositivos;
      geocercas = g.geocercas;
      eventos = e.eventos;
      renderGeocercas();
      for (const dev of dispositivos) upsertMarker(dev);
    } catch (err) {
      error = err.message;
    }
  }

  function onMapClick(e) {
    if (!modoDibujo) return;
    draftPoints = [...draftPoints, [e.latlng.lat, e.latlng.lng]];
    renderDraft();
  }

  function toggleDibujo() {
    modoDibujo = !modoDibujo;
    if (!modoDibujo) {
      draftPoints = [];
      renderDraft();
    }
  }

  function undoPoint() {
    draftPoints = draftPoints.slice(0, -1);
    renderDraft();
  }

  async function guardarGeocerca() {
    if (draftPoints.length < 3 || !nombreGeocerca.trim()) return;
    error = '';
    try {
      const coordenadas = draftPoints.map(([lat, lng]) => [lng, lat]);
      await geocercasApi.create({
        nombre: nombreGeocerca.trim(),
        color: colorGeocerca,
        tipo: 'polygon',
        coordenadas,
        activa: true,
      });
      nombreGeocerca = '';
      draftPoints = [];
      modoDibujo = false;
      renderDraft();
      await loadAll();
    } catch (err) {
      error = err.message;
    }
  }

  async function eliminarGeocerca(id) {
    if (!confirm('¿Eliminar esta geocerca?')) return;
    try {
      await geocercasApi.remove(id);
      await loadAll();
    } catch (err) {
      error = err.message;
    }
  }

  function enviarUbicacionSim(lat, lng) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(
      'ubicacion:actualizar',
      {
        identificador: 'SIM-WEB',
        lat,
        lng,
        accuracy: 8,
        speed: 1.2,
      },
      () => {}
    );
  }

  function toggleSimulador() {
    if (simulando) {
      clearInterval(simTimer);
      simTimer = null;
      simulando = false;
      return;
    }

    // Recorre un camino cerca del Zócalo (entra/sale de la geocerca seed)
    const path = [
      [19.438, -99.133],
      [19.436, -99.134],
      [19.4345, -99.1345],
      [19.4335, -99.134],
      [19.4328, -99.1335],
      [19.4325, -99.133],
      [19.4315, -99.132],
      [19.430, -99.131],
      [19.429, -99.133],
      [19.431, -99.135],
      [19.433, -99.136],
      [19.435, -99.135],
      [19.437, -99.134],
    ];
    let i = 0;
    simulando = true;
    enviarUbicacionSim(path[0][0], path[0][1]);
    simTimer = setInterval(() => {
      i = (i + 1) % path.length;
      enviarUbicacionSim(path[i][0], path[i][1]);
    }, 1500);
  }

  onMount(async () => {
    map = L.map(mapEl, { zoomControl: true }).setView(MAP_CENTER, MAP_ZOOM);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    geofenceLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    draftLayer = L.layerGroup().addTo(map);

    map.on('click', onMapClick);
    setTimeout(() => map?.invalidateSize(), 120);

    ubicarNavegador();
    await loadAll();

    const socket = getSocket();
    if (socket) {
      live = socket.connected;

      const onConnect = () => {
        live = true;
      };
      const onDisconnect = () => {
        live = false;
      };
      const onUbicacion = ({ dispositivo }) => {
        const idx = dispositivos.findIndex(
          (d) => d.identificador === dispositivo.identificador
        );
        if (idx >= 0) {
          dispositivos[idx] = { ...dispositivos[idx], ...dispositivo };
          dispositivos = [...dispositivos];
        } else {
          dispositivos = [...dispositivos, dispositivo];
        }
        upsertMarker(dispositivo);
      };
      const onEvento = ({ evento }) => {
        eventos = [evento, ...eventos].slice(0, 30);
      };
      const onGeocerca = () => {
        loadAll();
      };
      const onEstado = ({ identificador, enLinea }) => {
        dispositivos = dispositivos.map((d) =>
          d.identificador === identificador ? { ...d, enLinea } : d
        );
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('ubicacion:nueva', onUbicacion);
      socket.on('geocerca:evento', onEvento);
      socket.on('geocerca:actualizada', onGeocerca);
      socket.on('dispositivo:estado', onEstado);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('ubicacion:nueva', onUbicacion);
        socket.off('geocerca:evento', onEvento);
        socket.off('geocerca:actualizada', onGeocerca);
        socket.off('dispositivo:estado', onEstado);
      };
    }
  });

  onDestroy(() => {
    if (simTimer) clearInterval(simTimer);
    if (map) {
      map.off('click', onMapClick);
      map.remove();
      map = null;
    }
  });
</script>

<section class="monitor">
  <div class="map-pane">
    <div class="toolbar">
      <div class="left">
        <strong>Mapa en vivo</strong>
        <span class="live" class:on={live}>{live ? 'Socket activo' : 'Sin socket'}</span>
        {#if geoStatus === 'ubicando'}
          <span class="geo">Ubicándote…</span>
        {:else if geoStatus === 'denegado'}
          <span class="geo warn">Ubicación denegada</span>
        {:else if geoStatus === 'error' || geoStatus === 'no-soportado'}
          <span class="geo warn">Sin geolocalización</span>
        {/if}
      </div>
      <div class="right">
        <button onclick={ubicarNavegador} title="Centrar en mi ubicación">Mi ubicación</button>
        <button class:active={modoDibujo} onclick={toggleDibujo}>
          {modoDibujo ? 'Cancelar dibujo' : 'Dibujar geocerca'}
        </button>
        <button class:active={simulando} onclick={toggleSimulador}>
          {simulando ? 'Detener simulación' : 'Simular móvil'}
        </button>
      </div>
    </div>

    {#if modoDibujo}
      <div class="draw-bar">
        <input placeholder="Nombre de la geocerca" bind:value={nombreGeocerca} />
        <input type="color" bind:value={colorGeocerca} title="Color" />
        <span>{draftPoints.length} puntos</span>
        <button onclick={undoPoint} disabled={draftPoints.length === 0}>Deshacer</button>
        <button
          class="primary"
          onclick={guardarGeocerca}
          disabled={draftPoints.length < 3 || !nombreGeocerca.trim()}
        >
          Guardar
        </button>
        <em>Clic en el mapa para agregar vértices</em>
      </div>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <div class="map" bind:this={mapEl}></div>
  </div>

  <aside class="side">
    <div class="block">
      <h3>Dispositivos</h3>
      <ul>
        {#each dispositivos as d (d.id || d.identificador)}
          <li>
            <span class="dot" style="background:{d.color}"></span>
            <div>
              <strong>{d.persona || d.nombre}</strong>
              <small>{d.identificador} · {d.enLinea ? 'en línea' : 'offline'}</small>
            </div>
          </li>
        {:else}
          <li class="empty">Sin dispositivos</li>
        {/each}
      </ul>
    </div>

    <div class="block">
      <h3>Geocercas</h3>
      <ul>
        {#each geocercas as g (g.id)}
          <li>
            <span class="dot" style="background:{g.color}"></span>
            <div>
              <strong>{g.nombre}</strong>
              <small>{g.tipo} · {g.activa ? 'activa' : 'off'}</small>
            </div>
            <button class="mini" onclick={() => eliminarGeocerca(g.id)}>✕</button>
          </li>
        {:else}
          <li class="empty">Sin geocercas</li>
        {/each}
      </ul>
    </div>

    <div class="block grow">
      <h3>Entradas / salidas</h3>
      <ul class="events">
        {#each eventos as ev (ev.id)}
          <li class:entrada={ev.tipo === 'entrada'} class:salida={ev.tipo === 'salida'}>
            <strong>{ev.tipo}</strong>
            <span>
              {ev.dispositivo?.persona || ev.dispositivo?.nombre || '—'}
              → {ev.geocerca?.nombre || '—'}
            </span>
            <small>{formatDateTime(ev.fechaHora)}</small>
          </li>
        {:else}
          <li class="empty">Sin eventos aún</li>
        {/each}
      </ul>
    </div>
  </aside>
</section>

<style>
  .monitor {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 0.85rem;
    height: calc(100vh - 2.2rem);
    min-height: 520px;
  }

  .map-pane {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.55rem;
    min-width: 0;
  }

  .toolbar,
  .draw-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .left,
  .right {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .live {
    font-size: 0.78rem;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  .live.on {
    color: var(--accent);
    border-color: var(--accent);
  }

  .geo {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .geo.warn {
    color: var(--warning);
  }

  .draw-bar {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.5rem 0.65rem;
    justify-content: flex-start;
  }

  .draw-bar input:not([type='color']) {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.4rem 0.55rem;
    min-width: 160px;
  }

  .draw-bar input[type='color'] {
    width: 36px;
    height: 32px;
    border: none;
    background: transparent;
  }

  .draw-bar em {
    color: var(--text-muted);
    font-size: 0.82rem;
  }

  button {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.45rem 0.75rem;
  }

  button.active {
    border-color: var(--accent);
    color: var(--accent);
  }

  button.primary {
    background: var(--accent);
    color: #06261d;
    border-color: var(--accent);
    font-weight: 700;
  }

  button:disabled {
    opacity: 0.5;
  }

  .map {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    min-height: 420px;
  }

  .side {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.7rem;
    min-height: 0;
  }

  .block {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.75rem;
    overflow: auto;
  }

  .block.grow {
    min-height: 0;
  }

  h3 {
    margin: 0 0 0.55rem;
    font-size: 0.92rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  li {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    gap: 0.5rem;
    align-items: start;
    font-size: 0.88rem;
  }

  li div {
    display: grid;
  }

  li small,
  .events small {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 4px;
  }

  .mini {
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
  }

  .empty {
    color: var(--text-muted);
    grid-template-columns: 1fr;
  }

  .events li {
    grid-template-columns: 1fr;
    border-left: 3px solid var(--border);
    padding-left: 0.55rem;
  }

  .events li.entrada {
    border-left-color: var(--ok);
  }

  .events li.salida {
    border-left-color: var(--warning);
  }

  .error {
    margin: 0;
    color: var(--danger);
    font-size: 0.88rem;
  }

  :global(.dev-icon) {
    background: transparent;
    border: none;
  }

  :global(.dev-marker) {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--c) 35%, transparent);
    display: grid;
    place-items: center;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 55%, transparent);
  }

  :global(.dev-marker span) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
  }

  @media (max-width: 960px) {
    .monitor {
      grid-template-columns: 1fr;
      height: auto;
    }

    .side {
      grid-template-rows: none;
    }

    .map {
      height: 55vh;
    }
  }
</style>
