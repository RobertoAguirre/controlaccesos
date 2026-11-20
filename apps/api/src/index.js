import http from 'node:http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { socketCorsOrigin } from './config/cors.js';
import { createApp } from './app.js';
import { setupSockets } from './sockets/index.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  await connectDB();

  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: socketCorsOrigin(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    // Útil detrás de proxies / load balancers
    allowEIO3: true,
  });

  const app = createApp(io);
  server.on('request', app);

  setupSockets(io);

  server.listen(PORT, HOST, () => {
    console.log(`API escuchando en http://${HOST}:${PORT}`);
    console.log('REST + Socket.io listos (web / móvil Flutter)');
  });
}

main().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
