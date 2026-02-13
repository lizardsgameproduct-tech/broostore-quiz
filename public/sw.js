const CACHE_NAME = 'broostore-quiz-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/game.html',
  '/store.html',
  '/css/style.css',
  '/css/game.css',
  '/css/store.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/coins.js',
  '/js/game.js',
  '/js/store.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
