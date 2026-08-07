const CACHE_NAME = 'brunel-sailing-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/BrunelSailingIcon.jpeg',
  '/manifest.json'
];

// If running on localhost or 127.0.0.1, immediately self-unregister to allow Vite HMR
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
    );
  });
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache);
      })
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Bypass Vite dev server endpoints, HMR scripts, chrome extensions, and websockets
    if (
      !url.protocol.startsWith('http') ||
      url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules') ||
      url.protocol.startsWith('chrome-extension') ||
      url.protocol.startsWith('ws')
    ) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            const indexCache = await caches.match('/index.html');
            if (indexCache) return indexCache;
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/#/';

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  });

  // Handle Push notifications from Web Push API
  self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
      const data = event.data.json();
      const title = data.title || 'Brunel Sailing Alert';
      const options = {
        body: data.body || '',
        icon: '/BrunelSailingIcon.jpeg',
        badge: '/BrunelSailingIcon.jpeg',
        data: { url: data.url || '/#/' },
        vibrate: [200, 100, 200]
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
      console.error('Push notification error:', err);
    }
  });
}
