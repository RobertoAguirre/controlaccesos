<script>
  import { onMount } from 'svelte';
  import { dispositivosApi } from '../lib/api.js';

  let dispositivos = $state([]);
  let error = $state('');
  let showForm = $state(false);
  let editing = $state(null);

  let form = $state({
    nombre: '',
    identificador: '',
    persona: '',
    color: '#2dd4a8',
    activo: true,
  });

  async function load() {
    try {
      const data = await dispositivosApi.list();
      dispositivos = data.dispositivos;
    } catch (err) {
      error = err.message;
    }
  }

  function openCreate() {
    editing = null;
    form = {
      nombre: '',
      identificador: '',
      persona: '',
      color: '#2dd4a8',
      activo: true,
    };
    showForm = true;
  }

  function openEdit(d) {
    editing = d;
    form = {
      nombre: d.nombre,
      identificador: d.identificador,
      persona: d.persona || '',
      color: d.color || '#2dd4a8',
      activo: d.activo,
    };
    showForm = true;
  }

  async function save(e) {
    e.preventDefault();
    error = '';
    try {
      if (editing) {
        await dispositivosApi.update(editing.id, form);
      } else {
        await dispositivosApi.create(form);
      }
      showForm = false;
      await load();
    } catch (err) {
      error = err.message;
    }
  }

  async function remove(d) {
    if (!confirm(`¿Eliminar ${d.nombre}?`)) return;
    try {
      await dispositivosApi.remove(d.id);
      await load();
    } catch (err) {
      error = err.message;
    }
  }

  onMount(load);
</script>

<section class="page">
  <header class="page-head">
    <div>
      <h2>Dispositivos móviles</h2>
      <p>Cada móvil Flutter usará su <code>identificador</code> al conectar por sockets</p>
    </div>
    <button class="primary" onclick={openCreate}>Nuevo dispositivo</button>
  </header>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if showForm}
    <form class="card form" onsubmit={save}>
      <h3>{editing ? 'Editar' : 'Nuevo'} dispositivo</h3>
      <div class="grid">
        <label>Nombre <input bind:value={form.nombre} required /></label>
        <label>Identificador <input bind:value={form.identificador} required /></label>
        <label>Persona <input bind:value={form.persona} /></label>
        <label>Color <input type="color" bind:value={form.color} /></label>
        <label class="check">
          <input type="checkbox" bind:checked={form.activo} /> Activo
        </label>
      </div>
      <div class="actions">
        <button type="button" onclick={() => (showForm = false)}>Cancelar</button>
        <button class="primary" type="submit">Guardar</button>
      </div>
    </form>
  {/if}

  <div class="card table-wrap">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Nombre</th>
          <th>ID</th>
          <th>Persona</th>
          <th>Estado</th>
          <th>Última ubicación</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each dispositivos as d (d.id)}
          <tr>
            <td><span class="dot" style="background:{d.color}"></span></td>
            <td>{d.nombre}</td>
            <td class="mono">{d.identificador}</td>
            <td>{d.persona || '—'}</td>
            <td>{d.enLinea ? 'En línea' : 'Offline'}{d.activo ? '' : ' · inactivo'}</td>
            <td class="mono">
              {#if d.ultimaUbicacion}
                {d.ultimaUbicacion.lat.toFixed(5)}, {d.ultimaUbicacion.lng.toFixed(5)}
              {:else}
                —
              {/if}
            </td>
            <td class="row-actions">
              <button onclick={() => openEdit(d)}>Editar</button>
              <button class="danger" onclick={() => remove(d)}>Eliminar</button>
            </td>
          </tr>
        {:else}
          <tr><td colspan="7">Sin dispositivos</td></tr>
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
  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  code {
    font-family: var(--mono);
    color: var(--accent);
  }

  input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
  }

  button {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
  }

  button.primary {
    background: var(--accent);
    color: #06261d;
    border-color: var(--accent);
    font-weight: 700;
  }

  button.danger {
    color: var(--danger);
  }

  .card {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
  }

  .form {
    display: grid;
    gap: 0.9rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .check {
    align-content: end;
    grid-auto-flow: column;
    justify-content: start;
    gap: 0.4rem;
    align-items: center;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
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
    font-size: 0.82rem;
  }

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .row-actions {
    display: flex;
    gap: 0.35rem;
  }

  .error {
    color: var(--danger);
  }
</style>
