import type { StoredRecording, SavedRecording } from '../types/recording';

const DB_NAME = 'formcheck-recordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

/**
 * Opens the IndexedDB database, creating the object store if needed.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store with auto-incrementing key
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create index on timestamp for sorting
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Saves a recording to IndexedDB and returns the assigned id.
 */
export async function saveRecording(recording: SavedRecording): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.add(recording);

    request.onerror = () => {
      console.error('Failed to save recording:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets all recordings from IndexedDB, sorted by timestamp descending (newest first).
 */
export async function getAllRecordings(): Promise<StoredRecording[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    // Use cursor to iterate in reverse order (newest first)
    const recordings: StoredRecording[] = [];
    const request = index.openCursor(null, 'prev');

    request.onerror = () => {
      console.error('Failed to get recordings:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        recordings.push(cursor.value as StoredRecording);
        cursor.continue();
      } else {
        resolve(recordings);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets a single recording by id.
 */
export async function getRecording(id: number): Promise<StoredRecording | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onerror = () => {
      console.error('Failed to get recording:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve((request.result as StoredRecording) || null);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Deletes a recording by id.
 */
export async function deleteRecording(id: number): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onerror = () => {
      console.error('Failed to delete recording:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets storage statistics: count and total size in bytes.
 */
export async function getStorageStats(): Promise<{ count: number; totalSize: number }> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    let count = 0;
    let totalSize = 0;

    const request = store.openCursor();

    request.onerror = () => {
      console.error('Failed to get storage stats:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        count++;
        const recording = cursor.value as StoredRecording;
        totalSize += recording.fileSize;
        cursor.continue();
      } else {
        resolve({ count, totalSize });
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
