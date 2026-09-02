import { openDB } from '../utils/storage';

const CACHE_STORE = 'content_cache';
const memoryCache = new Map();

/**
 * Get content item from local IndexedDB cache with in-memory fallback.
 * @param {string} key
 * @returns {Promise<{ key: string, data: any, mimeType: string, timestamp: string }|null>}
 */
export async function getCachedContent(key) {
  if (!key) return null;

  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      const db = await openDB();
      const result = await new Promise((resolve) => {
        const tx = db.transaction(CACHE_STORE, 'readonly');
        const store = tx.objectStore(CACHE_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (result) {
        console.info(`[LocalCache] Cache HIT for key: ${key}`);
        return result;
      }
    }
  } catch (err) {
    console.warn(`[LocalCache] IndexedDB read notice: ${err.message}`);
  }

  // Memory cache fallback
  if (memoryCache.has(key)) {
    console.info(`[LocalCache] Memory Cache HIT for key: ${key}`);
    return memoryCache.get(key);
  }

  console.info(`[LocalCache] Cache MISS for key: ${key}`);
  return null;
}

/**
 * Save content item into local IndexedDB cache with in-memory fallback.
 * @param {string} key
 * @param {any} data
 * @param {string} [mimeType='application/octet-stream']
 */
export async function setCachedContent(key, data, mimeType = 'application/octet-stream') {
  if (!key || data === undefined) return null;

  const record = {
    key,
    data,
    mimeType,
    timestamp: new Date().toISOString(),
  };

  memoryCache.set(key, record);

  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_STORE);
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);
      });
      console.info(`[LocalCache] Cached content saved to IndexedDB: ${key}`);
    }
  } catch (err) {
    console.warn(`[LocalCache] IndexedDB save notice: ${err.message}`);
  }

  return record;
}

/**
 * Remove content item from local cache.
 * @param {string} key
 */
export async function removeCachedContent(key) {
  if (!key) return false;
  memoryCache.delete(key);
  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      const db = await openDB();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).delete(key);
    }
  } catch {}
  return true;
}

/**
 * Clear all items from local content cache.
 */
export async function clearContentCache() {
  memoryCache.clear();
  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      const db = await openDB();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).clear();
    }
  } catch {}
  console.info('[LocalCache] Content cache cleared successfully.');
  return true;
}
