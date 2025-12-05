// Simple IndexedDB wrapper to act as our "MongoDB" for local persistence
// This reduces API calls and stores historical data/tasks.

const DB_NAME = 'LannaIntelDB';
const DB_VERSION = 1;

export const STORES = {
  FLIGHTS: 'flights_history',
  WEBCAMS: 'webcams_cache',
  TASKS: 'tasks',
  CACHE_META: 'api_cache_meta'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.FLIGHTS)) {
        db.createObjectStore(STORES.FLIGHTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.WEBCAMS)) {
        db.createObjectStore(STORES.WEBCAMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.CACHE_META)) {
        db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
      }
    };
  });
};

export const dbService = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async add<T>(storeName: string, item: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: number | string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Cache validity checker
  async isCacheValid(key: string, ttlSeconds: number): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.CACHE_META, 'readonly');
      const store = transaction.objectStore(STORES.CACHE_META);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(false);
          return;
        }
        const now = Date.now();
        resolve((now - result.timestamp) < (ttlSeconds * 1000));
      };
      request.onerror = () => resolve(false);
    });
  },

  async updateCacheTimestamp(key: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORES.CACHE_META, 'readwrite');
    const store = transaction.objectStore(STORES.CACHE_META);
    store.put({ key, timestamp: Date.now() });
  }
};
