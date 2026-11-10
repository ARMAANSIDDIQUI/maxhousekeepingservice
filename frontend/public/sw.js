/**
 * Max Housekeeping Service - Progressive Web App Service Worker (v3.0)
 * Strictly prevents stale HTML-for-JS MIME caching on SPA deployments
 */

const CACHE_NAME = 'max-housekeeping-v3.0';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install: Pre-cache brand icons & manifest and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-caching notice:', err);
      });
    })
  );
});

// Activate: Purge all old cache versions (including any stale v2 HTML/JS entries) and claim tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Defensive handling that NEVER intercepts hashed Vite /assets/* or module scripts
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Pass through non-GET, API, third-party, hashed Vite bundles (/assets/), scripts, styles, and media natively
  if (
    req.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/assets/') ||
    /\.(js|mjs|css|wasm|mp4|webm|map)$/i.test(url.pathname)
  ) {
    return;
  }

  // 2. Navigation / HTML loads: Strict Network-first (no-store) so chunk hashes always match latest deploy
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-store' }))
        .then((response) => {
          return response;
        })
        .catch(() => {
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Offline - Max Housekeeping</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>You are currently offline</h2><p>Please check your internet connection.</p><button onclick="location.reload()" style="padding:10px 20px;cursor:pointer;">Retry</button></body></html>',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // 3. Same-origin images & icons: Stale-While-Revalidate (NEVER cache text/html responses)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(req)
          .then((networkResponse) => {
            const ct = networkResponse?.headers?.get('content-type') || '';
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic' &&
              !ct.includes('text/html')
            ) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, responseToCache);
              }).catch(() => {});
            }
          })
          .catch(() => {});

        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        const ct = networkResponse?.headers?.get('content-type') || '';
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !ct.includes('text/html')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          }).catch(() => {});
        }
        return networkResponse;
      });
    })
  );
});

// Skip waiting triggered by client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
