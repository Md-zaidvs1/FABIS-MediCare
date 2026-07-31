// FABIS MediCare - IndexedDB & Dual-Save Offline Storage Engine

const DB_NAME = 'FabisMedicareDB';
const DB_VERSION = 1;

export const STORES = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  EMRS: 'emrs',
  DENTAL_CHARTS: 'dental_charts',
  PERIODONTAL: 'periodontal_records',
  TREATMENTS: 'treatments',
  PRESCRIPTIONS: 'prescriptions',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  FOLLOW_UPS: 'follow_ups',
  CLINICAL_NOTES: 'clinical_notes',
  SETTINGS: 'settings',
  PENDING_SYNC: 'pending_sync_queue',
};

let dbPromise: Promise<IDBDatabase> | null = null;

export const initIndexedDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB is not supported in this environment.');
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === STORES.PENDING_SYNC) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          } else {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
};

// Generic Save to IndexedDB (Dual Save Support)
export const saveToIndexedDB = async (storeName: string, items: any | any[]): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    const itemList = Array.isArray(items) ? items : [items];
    itemList.forEach((item) => {
      if (item && (item.id || storeName === STORES.SETTINGS)) {
        store.put(item);
      }
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`Error writing to IndexedDB store ${storeName}:`, err);
  }
};

// Generic Read All from IndexedDB
export const getAllFromIndexedDB = async <T = any>(storeName: string): Promise<T[]> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error reading from IndexedDB store ${storeName}:`, err);
    return [];
  }
};

// Pending Sync Queue Operations
export interface PendingSyncItem {
  id?: number;
  entityType: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  retryCount: number;
}

export const enqueuePendingSync = async (entityType: string, action: 'create' | 'update' | 'delete', payload: any): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_SYNC);

    const item: PendingSyncItem = {
      entityType,
      action,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    store.add(item);
  } catch (err) {
    console.error('Failed to enqueue pending sync item:', err);
  }
};

export const getPendingSyncItems = async (): Promise<PendingSyncItem[]> => {
  return getAllFromIndexedDB<PendingSyncItem>(STORES.PENDING_SYNC);
};

export const removePendingSyncItem = async (id: number): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    store.delete(id);
  } catch (err) {
    console.error('Failed to remove pending sync item:', err);
  }
};

// Sync full state snapshot to IndexedDB (Dual-save handler)
export const dualSaveSnapshot = async (patients: any[]): Promise<void> => {
  try {
    // Save all patients & sub-records to IndexedDB
    await saveToIndexedDB(STORES.PATIENTS, patients);
  } catch (err) {
    console.error('Dual save snapshot to IndexedDB error:', err);
  }
};
