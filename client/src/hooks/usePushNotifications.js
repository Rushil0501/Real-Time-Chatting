import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../api/index.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW registration failed:', err));
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY not configured — push notifications are disabled');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await pushApi.subscribe(subscription.toJSON());
    setSubscribed(true);
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await pushApi.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setSubscribed(false);
  }, []);

  return { isSupported, permission, subscribed, subscribe, unsubscribe };
}
