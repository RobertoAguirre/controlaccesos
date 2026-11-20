<script>
  import { onMount } from 'svelte';
  import { auth } from './lib/auth.svelte.js';
  import { connectSocket, disconnectSocket } from './lib/socket.js';
  import Login from './components/Login.svelte';
  import MapaMonitor from './components/MapaMonitor.svelte';
  import Dispositivos from './components/Dispositivos.svelte';
  import Eventos from './components/Eventos.svelte';

  let vista = $state('mapa');

  const nav = [
    { id: 'mapa', label: 'Mapa en vivo' },
    { id: 'eventos', label: 'Entradas / salidas' },
    { id: 'dispositivos', label: 'Dispositivos' },
  ];

  onMount(async () => {
    await auth.hydrate();
    if (auth.token) connectSocket(auth.token);
  });

  $effect(() => {
    if (auth.isAuthenticated && auth.token) {
      connectSocket(auth.token);
    } else {
      disconnectSocket();
    }
  });

  function logout() {
    disconnectSocket();
    auth.logout();
    vista = 'mapa';
  }
</script>

{#if auth.loading}
  <div class="boot">Cargando…</div>
{:else if !auth.isAuthenticated}
  <Login />
{:else}
  <div class="shell" class:map-view={vista === 'mapa'}>
    <aside>
      <div class="brand">
        <strong>ControlAccesos</strong>
        <span>Tracking · geocercas</span>
      </div>
      <nav>
        {#each nav as item}
          <button
            class:active={vista === item.id}
            onclick={() => (vista = item.id)}
          >
            {item.label}
          </button>
        {/each}
      </nav>
      <div class="user">
        <div>
          <strong>{auth.user.nombre}</strong>
          <span>{auth.user.rol}</span>
        </div>
        <button onclick={logout}>Salir</button>
      </div>
    </aside>

    <main class:flush={vista === 'mapa'}>
      {#if vista === 'mapa'}
        <MapaMonitor />
      {:else if vista === 'eventos'}
        <Eventos />
      {:else if vista === 'dispositivos'}
        <Dispositivos />
      {/if}
    </main>
  </div>
{/if}

<style>
  .boot {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: var(--text-muted);
  }

  .shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 220px 1fr;
  }

  aside {
    border-right: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .brand {
    display: grid;
    gap: 0.15rem;
    padding: 0.25rem 0.5rem;
  }

  .brand strong {
    color: var(--accent);
    letter-spacing: 0.02em;
  }

  .brand span,
  .user span {
    color: var(--text-muted);
    font-size: 0.82rem;
  }

  nav {
    display: grid;
    gap: 0.35rem;
    flex: 1;
  }

  nav button,
  .user button {
    text-align: left;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    color: var(--text-muted);
  }

  nav button:hover,
  .user button:hover {
    background: var(--bg-soft);
    color: var(--text);
  }

  nav button.active {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    color: var(--accent);
    font-weight: 600;
  }

  .user {
    display: grid;
    gap: 0.6rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .user strong {
    display: block;
  }

  main {
    padding: 1.5rem;
    overflow: auto;
  }

  main.flush {
    padding: 0.75rem;
    overflow: hidden;
  }

  @media (max-width: 860px) {
    .shell {
      grid-template-columns: 1fr;
    }

    aside {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    nav {
      grid-auto-flow: column;
      grid-auto-columns: max-content;
      overflow-x: auto;
      flex: initial;
    }

    main.flush {
      overflow: auto;
    }
  }
</style>
