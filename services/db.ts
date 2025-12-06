

// Simple IndexedDB wrapper to act as our "MongoDB" for local persistence
// This reduces API calls and stores historical data/tasks.

const DB_NAME = 'LannaIntelDB';
const DB_VERSION = 5; // Incremented for Map Vector Stores

export const STORES = {
  FLIGHTS: 'flights_history',
  WEBCAMS: 'webcams_cache',
  TASKS: 'tasks',
  CACHE_META: 'api_cache_meta',
  SETTINGS: 'app_settings',
  RECORDINGS: 'audio_recordings',
  OFFLINE_DATA: 'offline_region_data', // Legacy Blob Store
  ALERTS: 'system_alerts',
  // New Vector Stores
  MAP_FEATURES: 'map_features',
  MAP_VERSIONS: 'map_versions'
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
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.RECORDINGS)) {
        db.createObjectStore(STORES.RECORDINGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.OFFLINE_DATA)) {
        db.createObjectStore(STORES.OFFLINE_DATA, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        db.createObjectStore(STORES.ALERTS, { keyPath: 'id' });
      }
      // New: Optimized Vector Store
      if (!db.objectStoreNames.contains(STORES.MAP_FEATURES)) {
          const featureStore = db.createObjectStore(STORES.MAP_FEATURES, { keyPath: 'id' });
          featureStore.createIndex('region', 'region', { unique: false });
          featureStore.createIndex('category', 'category', { unique: false });
      }
      // New: Version Control Store
      if (!db.objectStoreNames.contains(STORES.MAP_VERSIONS)) {
          db.createObjectStore(STORES.MAP_VERSIONS, { keyPath: 'region' });
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
  
  // Specific for Settings (Key-Value style)
  async getSetting(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => resolve(null);
    });
  },

  async saveSetting(key: string, value: any): Promise<void> {
      await this.add(STORES.SETTINGS, { key, value });
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
  },

  async getOfflineData(key: string): Promise<any | null> {
      const db = await openDB();
      return new Promise((resolve) => {
          const transaction = db.transaction(STORES.OFFLINE_DATA, 'readonly');
          const store = transaction.objectStore(STORES.OFFLINE_DATA);
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result ? request.result.value : null);
          request.onerror = () => resolve(null);
      });
  },
  
  // Alerts specific helpers
  async markAlertRead(id: string): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORES.ALERTS, 'readwrite');
    const store = transaction.objectStore(STORES.ALERTS);
    const getReq = store.get(id);
    
    getReq.onsuccess = () => {
       const data = getReq.result;
       if(data) {
           data.read = true;
           store.put(data);
       }
    };
  },

  async markAllAlertsRead(): Promise<void> {
      const db = await openDB();
      const transaction = db.transaction(STORES.ALERTS, 'readwrite');
      const store = transaction.objectStore(STORES.ALERTS);
      const request = store.getAll();
      
      request.onsuccess = () => {
          const alerts = request.result;
          alerts.forEach((alert: any) => {
              if(!alert.read) {
                  alert.read = true;
                  store.put(alert);
              }
          });
      };
  },

  // Map Feature Helpers
  async getFeaturesByRegion(region: string): Promise<any[]> {
      const db = await openDB();
      return new Promise((resolve) => {
          const tx = db.transaction(STORES.MAP_FEATURES, 'readonly');
          const index = tx.objectStore(STORES.MAP_FEATURES).index('region');
          const request = index.getAll(region);
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  },

  async batchAddFeatures(features: any[]): Promise<void> {
      const db = await openDB();
      const tx = db.transaction(STORES.MAP_FEATURES, 'readwrite');
      const store = tx.objectStore(STORES.MAP_FEATURES);
      
      features.forEach(f => store.put(f));
      
      return new Promise((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject();
      });
  }
};
