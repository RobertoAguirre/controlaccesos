<script>
  import { auth } from '../lib/auth.svelte.js';

  let email = $state('admin@controlaccesos.mx');
  let password = $state('Admin123!');
  let error = $state('');
  let submitting = $state(false);

  async function onSubmit(e) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      await auth.login(email.trim(), password);
    } catch (err) {
      error = err.message || 'No se pudo iniciar sesión';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="login-wrap">
  <form class="panel" onsubmit={onSubmit}>
    <p class="brand">ControlAccesos</p>
    <h1>Monitoreo en vivo</h1>
    <p class="hint">Mapa, geocercas y movimiento de dispositivos en tiempo real</p>

    <label>
      Email
      <input type="email" bind:value={email} required autocomplete="username" />
    </label>

    <label>
      Contraseña
      <input
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
      />
    </label>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <button type="submit" disabled={submitting}>
      {submitting ? 'Entrando…' : 'Entrar'}
    </button>
  </form>
</div>

<style>
  .login-wrap {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .panel {
    width: min(420px, 100%);
    background: linear-gradient(180deg, var(--bg-elevated), var(--bg-soft));
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: var(--shadow);
    display: grid;
    gap: 0.9rem;
  }

  .brand {
    margin: 0;
    color: var(--accent);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.85rem;
  }

  h1 {
    margin: 0;
    font-size: 1.55rem;
  }

  .hint {
    margin: 0 0 0.5rem;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.7rem 0.8rem;
  }

  input:focus {
    outline: 2px solid color-mix(in srgb, var(--accent) 45%, transparent);
    border-color: var(--accent);
  }

  button {
    margin-top: 0.4rem;
    background: var(--accent);
    color: #06261d;
    border: none;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    font-weight: 700;
  }

  button:disabled {
    opacity: 0.7;
  }

  .error {
    margin: 0;
    color: var(--danger);
    font-size: 0.9rem;
  }
</style>
