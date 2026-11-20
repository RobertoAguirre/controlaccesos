import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  // Preferir host de sockets; si no, la misma API (dev / Node persistente)
  const url =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    undefined;

  socket = io(url, {
    auth: { token },
    query: { cliente: 'web' },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
