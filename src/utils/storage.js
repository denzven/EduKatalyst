const DB_NAME = 'EncryptedVideoDB';
const DB_VERSION = 3; // Incremented for content_cache object store support
const STORE_NAME = 'video_sessions';
const CACHE_STORE_NAME = 'content_cache';

export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in environment.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        store = event.target.transaction.objectStore(STORE_NAME);
      }
      if (!store.indexNames.contains('createdAt')) {
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!store.indexNames.contains('category')) {
        store.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const storageChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('katalyst_storage_channel')
  : null;

function notifyStorageUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('katalyst_storage_updated'));
  }
  if (storageChannel) {
    try {
      storageChannel.postMessage({ type: 'STORAGE_UPDATED', timestamp: Date.now() });
    } catch (e) {
      // Ignore broadcast error
    }
  }
}

export function subscribeToStorageChannel(callback) {
  if (!storageChannel) return () => {};
  const handler = (event) => {
    if (event.data?.type === 'STORAGE_UPDATED') {
      console.info('[Storage] Cross-tab storage update notification received');
      callback(event.data);
    }
  };
  storageChannel.addEventListener('message', handler);
  return () => storageChannel.removeEventListener('message', handler);
}

export async function saveVideoSession(sessionData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: sessionData.id || `vid_${Date.now()}`,
      title: sessionData.title || 'Untitled Video',
      category: sessionData.category || 'General',
      tags: Array.isArray(sessionData.tags) ? sessionData.tags : [],
      description: sessionData.description || '',
      thumbnailUrl: sessionData.thumbnailUrl || null,
      createdAt: sessionData.createdAt || new Date().toISOString(),
      keyHex: sessionData.keyHex,
      keyBlob: sessionData.keyBlob,
      keyUri: sessionData.keyUri || 'https://mock-worker.local/get-key?vid=demo',
      playlistText: sessionData.playlistText,
      segments: sessionData.segments,
      segmentCount: Object.keys(sessionData.segments || {}).length,
      totalSizeBytes: sessionData.totalSizeBytes || 0
    };

    const request = store.put(record);
    request.onsuccess = () => {
      notifyStorageUpdated();
      resolve(record);
    };
    request.onerror = () => reject(request.error);
  });
}


export async function getAllVideoSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getVideoSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideoSession(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      notifyStorageUpdated();
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllSessions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => {
      console.info('[Storage] All video sessions cleared from IndexedDB');
      notifyStorageUpdated();
      resolve(true);
    };
    request.onerror = () => {
      console.error('[Storage] Failed to clear IndexedDB sessions:', request.error);
      reject(request.error);
    };
  });
}


/**
 * Initialize persistent origin storage and estimate browser quota usage
 */
export async function initStorageQuota() {
  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.info(`[Storage] Persistent storage granted: ${isPersisted}`);
      }

      if (navigator.storage.estimate) {
        const { quota, usage } = await navigator.storage.estimate();
        const usageMB = (usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (quota / (1024 * 1024)).toFixed(2);
        console.info(`[Storage] Disk Usage: ${usageMB} MB of ${quotaMB} MB quota`);
      }
    } catch (error) {
      console.warn('[Storage] Could not query storage estimate:', error);
    }
  }
}

/**
 * LRU Cache Eviction: Delete oldest video sessions when total IndexedDB storage exceeds threshold
 * Default threshold: 500 MB (500 * 1024 * 1024 bytes)
 */
export async function enforceVideoCacheLimit(maxBytes = 500 * 1024 * 1024) {
  try {
    const sessions = await getAllVideoSessions();
    let totalBytes = sessions.reduce((acc, s) => acc + (s.totalSizeBytes || 0), 0);

    if (totalBytes <= maxBytes) return;

    console.warn(`[Storage] IndexedDB storage (${(totalBytes / 1024 / 1024).toFixed(2)} MB) exceeds limit (${(maxBytes / 1024 / 1024).toFixed(2)} MB). Evicting oldest sessions...`);

    // Sort sessions by creation date (oldest first)
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const session of sorted) {
      if (totalBytes <= maxBytes) break;
      console.info(`[Storage] Evicting cached video session: ${session.title} (${session.id})`);
      await deleteVideoSession(session.id);
      totalBytes -= (session.totalSizeBytes || 0);
    }
  } catch (error) {
    console.error('[Storage] Error enforcing storage cache limit:', error);
  }
}

