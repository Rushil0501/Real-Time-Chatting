import { Router } from 'express';
import mongoose from 'mongoose';
import { redis } from '../config/redis.js';

const router = Router();

router.get('/', async (req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  let redisUp = false;
  try {
    redisUp = (await redis.ping()) === 'PONG';
  } catch {
    redisUp = false;
  }

  const ok = mongoUp && redisUp;
  res.status(ok ? 200 : 503).json({
    ok,
    mongo: mongoUp ? 'up' : 'down',
    redis: redisUp ? 'up' : 'down',
    uptime: process.uptime(),
  });
});

export default router;
