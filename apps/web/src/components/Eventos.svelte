<script>
  import { onMount } from 'svelte';
  import { eventosApi } from '../lib/api.js';
  import { formatDateTime } from '../lib/format.js';
  import { getSocket } from '../lib/socket.js';

  let eventos = $state([]);
  let stats = $state(null);
  let filtro = $state('');
  let error = $state('');

  async function load() {
    try {
      const params = { limit: 100 };
      if (filtro) params.tipo = filtro;
      const [e, s] = await Promise.all([eventosApi.list(params), eventosApi.stats()]);
      eventos = e.eventos;
      stats = s.stats;
    } catch (err) {
      error = err.message;
    }
  }

  onMount(() => {
    load();
    const socket = getSocket();
    if (!socket) return;
    const onEvento = ({ evento }) => {
      if (!filtro || evento.tipo === filtro) {
        eventos = [evento, ...eventos].slice(0, 100);
      }
      eventosApi.stats().then((s) => {
        stats = s.stats;
      });
    };
    socket.on('geocerca:evento', onEvento);
    return () => socket.off('geocerca:evento', onEvento);
  });
</script>

<section class="page">
  <header class="page-head">
    <div>
      <h2>Historial de geocercas</h2>
      <p>Quién entra y sale, en tiempo real</p>
    </div>
    <select bind:value={filtro} onchange={load}>
      <option value="">Todos</option>
      <option value="entrada">Entradas</option>
      <option value="salida">Salidas</option>
    </select>
  </header>

  {#if stats}
    <div class="stats">
      <article><span>Entradas hoy</span><strong>{stats.entradasHoy}</strong></article>
      <article><span>Salidas hoy</span><strong>{stats.salidasHoy}</strong></article>
      <article><span>En línea</span><strong>{stats.enLinea}</strong></article>
      <article><span>Geocercas</span><strong>{stats.geocercasActivas}</strong></article>
    </div>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="card table-wrap">
    <table>
      <thead>
        <tr>
          <th>Fecha / hora</th>
          <th>Evento</th>
          <th>Persona / dispositivo</th>
          <th>Geocerca</th>
          <th>Ubicación</th>
        </tr>
      </thead>
      <tbody>
        {#each eventos as ev (ev.id)}
          <tr>
            <td class="mono">{formatDateTime(ev.fechaHora)}</td>
            <td>
              <span class="badge" class:entrada={ev.tipo === 'entrada'} class:salida={ev.tipo === 'salida'}>
                {ev.tipo}
              </span>
            </td>
            <td>
              {ev.dispositivo?.persona || ev.dispositivo?.nombre || '—'}
              <small class="mono">{ev.dispositivo?.identificador || ''}</small>
            </td>
            <td>{ev.geocerca?.nombre || '—'}</td>
            <td class="mono">
              {ev.ubicacion?.lat?.toFixed(5)}, {ev.ubicacion?.lng?.toFixed(5)}
            </td>
          </tr>
        {:else}
          <tr><td colspan="5">Sin eventos</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .page {
    display: grid;
    gap: 1rem;
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  h2,
  p {
    margin: 0;
  }

  p {
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  select {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.7rem;
  }

  .stats article {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.9rem;
    display: grid;
    gap: 0.3rem;
  }

  .stats span {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .stats strong {
    font-size: 1.4rem;
  }

  .card {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.5rem 1rem 1rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.65rem 0.45rem;
    border-bottom: 1px solid var(--border);
  }

  th {
    color: var(--text-muted);
    font-weight: 500;
  }

  .mono {
    font-family: var(--mono);
    font-size: 0.8rem;
  }

  small.mono {
    display: block;
    color: var(--text-muted);
  }

  .badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    background: var(--bg-soft);
  }

  .badge.entrada {
    color: var(--ok);
    background: color-mix(in srgb, var(--ok) 18%, transparent);
  }

  .badge.salida {
    color: var(--warning);
    background: color-mix(in srgb, var(--warning) 18%, transparent);
  }

  .error {
    color: var(--danger);
  }
</style>
