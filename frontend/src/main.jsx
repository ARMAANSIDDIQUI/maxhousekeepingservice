import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-recover if a user tab hits a stale module chunk right after a new deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'max_chunk_reload_at';
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker with automatic hourly updates & instant activation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Global manual cache purge helper (callable from browser console: window.purgeAppCache())
  window.purgeAppCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      window.location.reload();
    } catch (e) {
      console.warn('Cache purge notice:', e);
      window.location.reload();
    }
  };

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // 1. Immediately activate new worker when installed
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version ready. Activating...');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // 2. Automated Periodic Cache Check (Checks for new version every 1 hour)
          const CACHE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
          setInterval(() => {
            reg.update().catch(() => {});
          }, CACHE_CHECK_INTERVAL_MS);

          // 3. Check for fresh updates whenever user returns to the tab
          window.addEventListener('focus', () => {
            reg.update().catch(() => {});
          });
        })
        .catch((err) => {
          console.warn('[PWA] SW registration notice:', err);
        });

      // Reload page once new service worker takes control so user gets fresh assets
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  } else {
    // In local development, unregister any lingering service workers to avoid stale caches & HMR conflicts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
}

