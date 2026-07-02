import { nanoid } from 'nanoid';
import { redis } from '../config/redis.js';
import { User } from '../models/User.js';

const PRESENCE_PREFIX = 'presence:user:';
export const HEARTBEAT_INTERVAL_MS = 20_000;
const STALE_THRESHOLD_MS = HEARTBEAT_INTERVAL_MS * 2.5;
const REAPER_INTERVAL_MS = 60_000;
const REAPER_LOCK_KEY = 'presence:reaper:lock';
const REAPER_LOCK_TTL_MS = 30_000;

// All authenticated sockets join this room so presence changes can be broadcast
// without computing each user's shared-channel audience on every connect/disconnect.
// Simple and O(1) per event; the tradeoff is presence is app-wide rather than
// scoped to contacts, which is an acceptable simplification at this app's scale.
export const PRESENCE_ROOM = 'presence:broadcast';

function presenceKey(userId) {
  return `${PRESENCE_PREFIX}${userId}`;
}

// Returns true if this is the user's first active socket (i.e. they just came online).
export async function markOnline(userId, socketId) {
  const key = presenceKey(userId);
  const wasOffline = (await redis.hlen(key)) === 0;
  await redis.hset(key, socketId, new Date().toISOString());
  return wasOffline;
}

// Returns true if the user has no more active sockets (i.e. they just went offline).
export async function markOffline(userId, socketId) {
  const key = presenceKey(userId);
  await redis.hdel(key, socketId);
  const remaining = await redis.hlen(key);
  if (remaining === 0) {
    await redis.del(key);
    await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
  }
  return remaining === 0;
}

export async function heartbeat(userId, socketId) {
  await redis.hset(presenceKey(userId), socketId, new Date().toISOString());
}

export async function isOnline(userId) {
  return (await redis.hlen(presenceKey(userId))) > 0;
}

export async function getOnlineUserIds(userIds) {
  if (userIds.length === 0) return [];
  const pipeline = redis.pipeline();
  userIds.forEach((id) => pipeline.hlen(presenceKey(id)));
  const results = await pipeline.exec();
  return userIds.filter((_, i) => results[i][1] > 0);
}

// Refreshes the heartbeat timestamp for every socket currently connected to THIS
// server instance. Called on an interval from sockets/index.js.
export async function heartbeatLocalSockets(io) {
  const sockets = await io.local.fetchSockets();
  const pipeline = redis.pipeline();
  for (const socket of sockets) {
    if (socket.data.userId) {
      pipeline.hset(presenceKey(socket.data.userId), socket.id, new Date().toISOString());
    }
  }
  if (sockets.length > 0) {
    await pipeline.exec();
  }
}

// Periodic, leader-elected job that drops presence entries whose heartbeat has gone
// stale (crashed process, killed instance, network partition) so a user can't stay
// "online" forever after an ungraceful shutdown. Only one server instance runs this
// at a time, enforced via a short-lived Redis lock.
export function startPresenceReaper(io) {
  const instanceId = nanoid(8);

  const interval = setInterval(async () => {
    try {
      const gotLock = await redis.set(REAPER_LOCK_KEY, instanceId, 'PX', REAPER_LOCK_TTL_MS, 'NX');
      if (!gotLock) return;

      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${PRESENCE_PREFIX}*`, 'COUNT', 100);
        cursor = nextCursor;

        for (const key of keys) {
          const entries = await redis.hgetall(key);
          const staleSocketIds = Object.entries(entries)
            .filter(([, ts]) => Date.now() - new Date(ts).getTime() > STALE_THRESHOLD_MS)
            .map(([socketId]) => socketId);

          if (staleSocketIds.length === 0) continue;

          await redis.hdel(key, ...staleSocketIds);
          const remaining = await redis.hlen(key);
          if (remaining === 0) {
            await redis.del(key);
            const userId = key.slice(PRESENCE_PREFIX.length);
            const lastSeenAt = new Date();
            await User.findByIdAndUpdate(userId, { lastSeenAt });
            io.to(PRESENCE_ROOM).emit('presence:offline', { userId, lastSeenAt });
          }
        }
      } while (cursor !== '0');
    } catch (err) {
      console.error('[presence reaper] error:', err.message);
    }
  }, REAPER_INTERVAL_MS);

  return () => clearInterval(interval);
}
