// Draft offline caching utility
// NOT wired into the app yet - standalone for future integration
// IMPORTANT: This can only cache content already fetched while online.
// It CANNOT generate new AI responses, flashcards, or any content without connectivity.
// This uses IndexedDB (via a simple wrapper) instead of localStorage since the
// content could be large (flashcard sets, full conversations) and localStorage
// has tight size limits (~5-10MB) that would fill up quickly.

const DB_NAME = "logynis_offline_cache";
const DB_VERSION = 1;
const STORE_NAME = "cached_content";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheContent(key, data, type) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, data, type, cachedAt: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("[offline-cache-write-error]", err);
    return false;
  }
}

export async function getCachedContent(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[offline-cache-read-error]", err);
    return null;
  }
}

export async function getAllCachedByType(type) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []).filter(item => item.type === type);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("[offline-cache-list-error]", err);
    return [];
  }
}

export async function deleteCachedContent(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    return true;
  } catch (err) {
    console.error("[offline-cache-delete-error]", err);
    return false;
  }
}

export function isOnline() {
  return navigator.onLine;
      }
