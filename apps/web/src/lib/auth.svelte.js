import { authApi } from './api.js';

function createAuth() {
  let user = $state(null);
  let token = $state(localStorage.getItem('ca_token'));
  let loading = $state(true);

  async function hydrate() {
    if (!token) {
      loading = false;
      return;
    }
    try {
      const data = await authApi.me();
      user = data.user;
    } catch {
      logout();
    } finally {
      loading = false;
    }
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    token = data.token;
    user = data.user;
    localStorage.setItem('ca_token', data.token);
    return data.user;
  }

  function logout() {
    token = null;
    user = null;
    localStorage.removeItem('ca_token');
  }

  return {
    get user() {
      return user;
    },
    get token() {
      return token;
    },
    get loading() {
      return loading;
    },
    get isAuthenticated() {
      return Boolean(user && token);
    },
    hydrate,
    login,
    logout,
  };
}

export const auth = createAuth();
