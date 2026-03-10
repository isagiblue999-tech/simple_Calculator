const CACHE_NAME = 'calc-stealth-cache-v1';
const urlsToCache =[
  './',
  './index.html',
  './style.css',
  './script.js'
];

// Install and cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});