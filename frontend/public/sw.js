/**
 * Max Housekeeping Service - Progressive Web App Service Worker (v3.1)
 * - Strictly prevents stale HTML-for-JS MIME caching on SPA deployments
 * - Saves /media/site/*.mp4 Hero Videos locally in persistent Cache Storage with HTTP 206 Range support for instant loading
 */

const CACHE_NAME = 'max-housekeeping-v3.1';
const HERO_MEDIA_CACHE = 'max-hero-media-v1';
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

// Activate: Purge old app-shell cache versions (preserve max-hero-media-v1 video cache) and claim tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== HERO_MEDIA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Cache-First Hero Video Handler with full HTTP 206 Partial Content support
 * Ensures browsers & mobile Safari play saved local videos instantaneously without re-downloading.
 */
async function handleMediaVideoRequest(req) {
  const cleanUrl = req.url.split('?')[0];
  try {
    const cache = await caches.open(HERO_MEDIA_CACHE);
    let cachedRes = await cache.match(cleanUrl);

    if (!cachedRes) {
      const cleanReq = new Request(cleanUrl, { method: 'GET' });
      const netRes = await fetch(cleanReq);
      const ct = netRes?.headers?.get('content-type') || '';
      if (netRes && netRes.status === 200 && !ct.includes('text/html')) {
        await cache.put(cleanUrl, netRes.clone());
        cachedRes = netRes;
      } else {
        return fetch(req);
      }
    }

    const rangeHeader = req.headers.get('range');
    if (!rangeHeader) {
      return cachedRes;
    }

    const arrayBuffer = await cachedRes.arrayBuffer();
    const bytesMatch = /^bytes=(\d+)-(\d+)?$/i.exec(rangeHeader);
    if (!bytesMatch) {
      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': cachedRes.headers.get('Content-Type') || 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Length': String(arrayBuffer.byteLength)
        }
      });
    }

    const start = Number(bytesMatch[1]);
    const end = bytesMatch[2]
      ? Math.min(Number(bytesMatch[2]), arrayBuffer.byteLength - 1)
      : arrayBuffer.byteLength - 1;
    const chunk = arrayBuffer.slice(start, end + 1);

    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': cachedRes.headers.get('Content-Type') || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
        'Content-Length': String(chunk.byteLength)
      }
    });
  } catch {
    return fetch(req);
  }
}

// Fetch: Defensive handling that NEVER intercepts hashed Vite /assets/* or module scripts
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || !url.protocol.startsWith('http') || url.hostname !== self.location.hostname) {
    return;
  }

  // 1. Saved Hero Media Videos: Cache-First with Range support for instant playback
  if (url.pathname.startsWith('/media/site/') && /\.(mp4|webm)$/i.test(url.pathname)) {
    event.respondWith(handleMediaVideoRequest(req));
    return;
  }

  // 2. Pass through API, hashed Vite bundles (/assets/), scripts, styles, and source maps natively
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/assets/') ||
    /\.(js|mjs|css|wasm|mp4|webm|map)$/i.test(url.pathname)
  ) {
    return;
  }

  // 3. Navigation / HTML loads: Strict Network-first (no-store) so chunk hashes always match latest deploy
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-store' }))
        .then((response) => response)
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

  // 4. Same-origin images & icons: Stale-While-Revalidate (NEVER cache text/html responses)
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
