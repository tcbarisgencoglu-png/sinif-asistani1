const CACHE_NAME = 'sinif-asistani-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/license-config.js',
  './js/state.js',
  './js/performance.js',
  './js/books.js',
  './js/homework.js',
  './js/weekly.js',
  './js/dashboard.js',
  './js/timer.js',
  './js/quick-caller.js',
  './js/games.js',
  './js/config.js',
  './js/xlsx.full.min.js',
  './js/chart.min.js',
  './icons/icon-128.png',
  './icons/icon-256.png',
  './icons/icon-512.png'
];

// Install: Cache all initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle local/same-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch new copy in background (stale-while-revalidate pattern)
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore network check errors */});
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  }
});
