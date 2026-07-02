import Redis from 'ioredis';
import { env } from './env.js';

function createClient(name) {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  client.on('connect', () => console.log(`[redis:${name}] connected`));
  client.on('error', (err) => console.error(`[redis:${name}] error:`, err.message));
  return client;
}

// General-purpose client used for presence tracking, rate limiting, distributed locks.
export const redis = createClient('main');

// Socket.io redis-adapter requires two dedicated connections (pub + sub) that are
// not used for anything else, since subscriber connections can't run normal commands.
export function createAdapterClients() {
  const pubClient = createClient('adapter-pub');
  const subClient = createClient('adapter-sub');
  return { pubClient, subClient };
}
