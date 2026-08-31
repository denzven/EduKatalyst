const DB_NAME = 'EncryptedVideoDB';
const DB_VERSION = 2; // Incremented for category & tags schema support
const STORE_NAME = 'video_sessions';

function openDB() {
  return new Promise((resolve, reject) => {
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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('katalyst_storage_updated'));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('katalyst_storage_updated'));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('katalyst_storage_updated'));
      }
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}
