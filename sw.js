const CACHE_NAME = 'dropwave-v2';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Let WebRTC & CDN requests pass through directly
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});