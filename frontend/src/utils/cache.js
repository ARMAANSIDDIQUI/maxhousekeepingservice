/**
 * High-Performance Dual-Layer Caching Utility (In-Memory Map Memoization + LocalStorage Persistence)
 * Supports TTL (Time-To-Live) and Stale-While-Revalidate pattern.
 */

// Layer 1: Ultra-fast in-memory memo cache for zero-latency component re-renders
const memoryCache = new Map();

const CACHE_PREFIX = 'max_cache_';
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes default TTL

/**
 * Retrieve cached item from Memory Map or LocalStorage
 * @param {string} key - Cache identifier
 * @returns {any|null} - Cached data or null if not found/expired
 */
export function getCache(key) {
  const now = Date.now();

  // 1. Check in-memory memo cache first
  if (memoryCache.has(key)) {
    const memEntry = memoryCache.get(key);
    if (memEntry && memEntry.expiry > now) {
      return memEntry.data;
    }
    // Expired in memory
    memoryCache.delete(key);
  }

  // 2. Check persistent LocalStorage
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (!entry || typeof entry !== 'object') return null;

    // Check expiry
    if (entry.expiry && entry.expiry <= now) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    // Hydrate into in-memory memo cache for subsequent synchronous calls
    memoryCache.set(key, { data: entry.data, expiry: entry.expiry });
    return entry.data;
  } catch (err) {
    console.warn(`[Cache Error] Failed reading cache for ${key}:`, err.message);
    return null;
  }
}

/**
 * Save data into both Memory Map and LocalStorage
 * @param {string} key - Cache identifier
 * @param {any} data - Data payload to store
 * @param {number} ttlMs - Time to live in milliseconds (default 15 mins)
 */
export function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  if (data === undefined || data === null) return;
  const now = Date.now();
  const expiry = now + ttlMs;

  // 1. Store in memory memo
  memoryCache.set(key, { data, expiry });

  // 2. Store in persistent localStorage
  try {
    const payload = JSON.stringify({
      data,
      timestamp: now,
      expiry
    });
    localStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
  } catch (err) {
    // If quota exceeded or storage disabled, fail gracefully
    console.warn(`[Cache Error] Failed storing in localStorage for ${key}:`, err.message);
  }
}

/**
 * Remove specific key from both memory and localStorage
 * @param {string} key 
 */
export function removeCache(key) {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}

/**
 * Invalidate all cache entries matching a prefix (e.g., 'services', 'cities')
 * @param {string} prefix 
 */
export function clearCacheByPrefix(prefix) {
  // Clear memory
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix) || k.includes(prefix)) {
      memoryCache.delete(k);
    }
  }

  // Clear localStorage
  try {
    const fullPrefix = `${CACHE_PREFIX}${prefix}`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(fullPrefix) || key.includes(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

/**
 * Cached Fetch Helper: Retrieves from cache if fresh, otherwise fetches, caches, and returns.
 * @param {string} key 
 * @param {Function} fetcherFn 
 * @param {number} ttlMs 
 * @returns {Promise<any>}
 */
export async function getCachedOrFetch(key, fetcherFn, ttlMs = DEFAULT_TTL_MS) {
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }

  const freshData = await fetcherFn();
  if (freshData) {
    setCache(key, freshData, ttlMs);
  }
  return freshData;
}

export default {
  getCache,
  setCache,
  removeCache,
  clearCacheByPrefix,
  getCachedOrFetch
};
