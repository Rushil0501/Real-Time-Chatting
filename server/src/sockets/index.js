import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { createAdapterClients } from '../config/redis.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { listUserChannels } from '../services/channelService.js';
import { heartbeatLocalSockets, startPresenceReaper, HEARTBEAT_INTERVAL_MS } from '../services/presenceService.js';
import { setIO } from './ioAccessor.js';

import { handlePresenceConnect, handlePresenceDisconnect, registerPresenceHandlers } from './handlers/presenceHandler.js';
import { registerMessageHandlers } from './handlers/messageHandler.js';
import { registerTypingHandlers } from './handlers/typingHandler.js';
import { registerChannelHandlers } from './handlers/channelHandler.js';
import { registerCallHandlers } from './handlers/callHandler.js';

export async function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  const { pubClient, subClient } = createAdapterClients();
  io.adapter(createAdapter(pubClient, subClient));

  // JWT is verified once at handshake time only — sockets stay connected across
  // access-token expiry, since re-verifying per-event would be wasted work for a
  // token that's already scoped to a live, authenticated connection.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`[socket] connected ${socket.id} user=${socket.data.userId}`);

    socket.join(`user:${socket.data.userId}`);

    try {
      const channels = await listUserChannels(socket.data.userId);
      channels.forEach((channel) => socket.join(`channel:${channel.id}`));
    } catch (err) {
      console.error('[socket] failed to auto-join channels:', err.message);
    }

    try {
      await handlePresenceConnect(io, socket);
    } catch (err) {
      console.error('[socket] presence connect error:', err.message);
    }

    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerChannelHandlers(io, socket);
    registerPresenceHandlers(io, socket);
    registerCallHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`[socket] disconnected ${socket.id} user=${socket.data.userId}`);
      try {
        await handlePresenceDisconnect(io, socket);
      } catch (err) {
        console.error('[socket] presence disconnect error:', err.message);
      }
    });
  });

  const heartbeatInterval = setInterval(() => {
    heartbeatLocalSockets(io).catch((err) => console.error('[presence] heartbeat error:', err.message));
  }, HEARTBEAT_INTERVAL_MS);

  const stopReaper = startPresenceReaper(io);

  setIO(io);

  async function shutdown() {
    clearInterval(heartbeatInterval);
    stopReaper();
    io.disconnectSockets(true);
    await Promise.all([pubClient.quit(), subClient.quit()]);
  }

  return { io, shutdown };
}
