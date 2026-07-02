import http from 'node:http';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { redis } from './config/redis.js';
import { createApp } from './app.js';
import { initSocket } from './sockets/index.js';
import * as presenceService from './services/presenceService.js';

async function main() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const { io, shutdown: shutdownSockets } = await initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  let shuttingDown = false;
  async function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] received ${signal}, shutting down gracefully...`);

    try {
      // Proactively clear this instance's presence entries rather than waiting on
      // the reaper, so users don't appear falsely "online" during a normal deploy.
      const sockets = await io.local.fetchSockets();
      await Promise.all(sockets.map((s) => presenceService.markOffline(s.data.userId, s.id)));
    } catch (err) {
      console.error('[server] error clearing presence on shutdown:', err.message);
    }

    await shutdownSockets();
    await new Promise((resolve) => httpServer.close(resolve));
    await disconnectDB();
    await redis.quit();

    console.log('[server] shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
