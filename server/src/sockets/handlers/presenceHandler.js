import { z } from 'zod';
import { createSocketAction } from '../socketAction.js';
import * as presenceService from '../../services/presenceService.js';
import { PRESENCE_ROOM } from '../../services/presenceService.js';

export async function handlePresenceConnect(io, socket) {
  socket.join(PRESENCE_ROOM);
  const wasOffline = await presenceService.markOnline(socket.data.userId, socket.id);
  if (wasOffline) {
    io.to(PRESENCE_ROOM).emit('presence:online', { userId: socket.data.userId });
  }
}

export async function handlePresenceDisconnect(io, socket) {
  const wentOffline = await presenceService.markOffline(socket.data.userId, socket.id);
  if (wentOffline) {
    io.to(PRESENCE_ROOM).emit('presence:offline', {
      userId: socket.data.userId,
      lastSeenAt: new Date().toISOString(),
    });
  }
}

const querySchema = z.object({ userIds: z.array(z.string()).max(200) });

// Lets a freshly-connected client ask "which of these users are online right now",
// since presence:online/offline events only fire on state transitions, not as a snapshot.
export function registerPresenceHandlers(io, socket) {
  socket.on(
    'presence:query',
    createSocketAction(socket, querySchema, async ({ userIds }) => {
      const onlineUserIds = await presenceService.getOnlineUserIds(userIds);
      return { onlineUserIds };
    })
  );
}
