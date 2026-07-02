import { catchAsync } from '../utils/catchAsync.js';
import { env } from '../config/env.js';
import * as pushNotificationService from '../services/pushNotificationService.js';

export const getVapidPublicKey = catchAsync(async (req, res) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY || null });
});

export const subscribe = catchAsync(async (req, res) => {
  await pushNotificationService.subscribe(req.userId, req.body, req.headers['user-agent']);
  res.status(201).json({ ok: true });
});

export const unsubscribe = catchAsync(async (req, res) => {
  await pushNotificationService.unsubscribe(req.userId, req.body.endpoint);
  res.status(200).json({ ok: true });
});
