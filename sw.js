// Offline-first service worker: everything the app needs is precached on
// install. Bump CACHE_VERSION on every deploy that changes any precached file.
const CACHE_VERSION = 'elements-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/progress.js',
  './js/games.js',
  './js/crystals.js',
  './data/elements.json',
  './data/kid-content.json',
  './data/games.json',
  './data/journey.json',
  './assets/icon.svg',
  './assets/icon-maskable.svg',
  './assets/nova.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Offline and not precached: fall back to the app shell for navigations.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
