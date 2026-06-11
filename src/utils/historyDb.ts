import { HistoryItem } from '../types';

const DB_NAME = 'BigShortStudioHistoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'compositions';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error || new Error('Failed to save history item'));
    };
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error || new Error('Failed to delete history item'));
    };
  });
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error || new Error('Failed to clear history'));
    };
  });
}

export async function getAllHistoryItems(): Promise<HistoryItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as HistoryItem[];
        // Sort descending by timestamp or id so newest designs appear first
        items.sort((a, b) => b.id.localeCompare(a.id));
        resolve(items);
      };
      
      request.onerror = () => {
        reject(request.error || new Error('Failed to list history items'));
      };
    });
  } catch (err) {
    console.error('IndexedDB is not available/accessible. Falling back to empty array.', err);
    return [];
  }
}
