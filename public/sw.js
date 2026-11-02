self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let title = 'Loky Chat - لوكي شات 🚀';
  let body = 'لديك إشعار جديد في تطبيق لوكي شات!';
  try {
    if (event.data) {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || data.message || body;
    }
  } catch(e) {
    if (event.data) body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      vibrate: [200, 100, 200],
      tag: 'loky-chat-alert',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
