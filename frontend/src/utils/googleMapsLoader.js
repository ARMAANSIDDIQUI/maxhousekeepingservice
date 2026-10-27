/**
 * Singleton Google Maps JavaScript SDK Loader
 * Ensures script is injected only once globally with required libraries (places, marker)
 * Minimizes network overhead, prevents duplicate script tags, and handles asynchronous initialization
 */

let loadPromise = null;
let cachedApiKey = null;

export async function fetchGoogleMapsApiKey() {
  if (cachedApiKey) return cachedApiKey;

  // 1. Check Vite environment variable
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  if (envKey) {
    cachedApiKey = envKey;
    return cachedApiKey;
  }

  // 2. Fallback: Fetch dynamic public settings from backend
  try {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
    const res = await fetch(`${apiBase}/public/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data?.settings?.googleMapsApiKey) {
        cachedApiKey = String(data.settings.googleMapsApiKey).trim();
        return cachedApiKey;
      }
    }
  } catch (err) {
    console.warn('[GoogleMapsLoader] Failed to fetch key from public settings:', err.message);
  }

  return '';
}

export function loadGoogleMapsScript(customKey = '') {
  // If already loaded in window
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const apiKey = customKey || (await fetchGoogleMapsApiKey());

    if (!apiKey) {
      throw new Error('Google Maps API key is not configured. Falling back to manual address mode.');
    }

    return new Promise((resolve, reject) => {
      // Check if existing script tag is already in DOM
      const existingScript = document.querySelector('script[data-google-maps-loader="true"]');
      if (existingScript) {
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
          return;
        }
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps-loader', 'true');

      script.onload = async () => {
        if (window.google?.maps) {
          if (typeof window.google.maps.importLibrary === 'function') {
            try {
              await Promise.all([
                window.google.maps.importLibrary('places').catch(() => {}),
                window.google.maps.importLibrary('maps').catch(() => {}),
                window.google.maps.importLibrary('geocoding').catch(() => {})
              ]);
            } catch (err) {
              console.warn('[GoogleMapsLoader] importLibrary note:', err);
            }
          }
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
        }
      };

      script.onerror = (err) => {
        loadPromise = null; // allow retry
        reject(new Error('Failed to load Google Maps script. Check network connection or API key restriction.'));
      };

      document.head.appendChild(script);
    });
  })();

  return loadPromise;
}

export default loadGoogleMapsScript;
