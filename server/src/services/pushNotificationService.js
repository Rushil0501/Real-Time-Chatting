import webpush from 'web-push';
import { env } from '../config/env.js';
import { PushSubscription } from '../models/PushSubscription.js';

const vapidConfigured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(env.VAPID_CONTACT_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
} else {
  console.warn('[push] VAPID keys not configured — push notifications are disabled');
}

export async function subscribe(userId, { endpoint, keys }, userAgent) {
  return PushSubscription.findOneAndUpdate(
    { endpoint },
    { user: userId, endpoint, keys, userAgent: userAgent ?? '' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function unsubscribe(userId, endpoint) {
  await PushSubscription.deleteOne({ user: userId, endpoint });
}

export async function sendPushToUser(userId, payload) {
  if (!vapidConfigured) return;

  const subscriptions = await PushSubscription.find({ user: userId });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 means the browser/OS invalidated this subscription — clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error('[push] send failed:', err.message);
        }
      }
    })
  );
}
