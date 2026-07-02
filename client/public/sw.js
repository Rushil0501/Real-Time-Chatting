self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New message';
  const options = {
    body: data.body || '',
    icon: '/favicon.svg',
    data: { channelId: data.channelId },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const channelId = event.notification.data?.channelId;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (channelId) client.postMessage({ type: 'notification-click', channelId });
          return undefined;
        }
      }
      return clients.openWindow ? clients.openWindow('/') : undefined;
    })
  );
});
