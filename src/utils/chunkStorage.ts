import type { RecordingChunk, ContinuousSession } from '../types/recording';

const DB_NAME = 'formcheck-chunks';
const DB_VERSION = 1;
const CHUNKS_STORE = 'chunks';
const SESSIONS_STORE = 'sessions';

/**
 * Opens the chunks database, creating object stores if needed.
 */
export function openChunkDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open chunks database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create chunks store with auto-incrementing key
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const chunksStore = db.createObjectStore(CHUNKS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Index for getting chunks by session
        chunksStore.createIndex('sessionId', 'sessionId', { unique: false });
        // Index for finding pending uploads
        chunksStore.createIndex('uploaded', 'uploaded', { unique: false });
      }

      // Create sessions store with sessionId as key
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
          keyPath: 'sessionId',
        });

        // Index for finding active sessions
        sessionsStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

/**
 * Saves a chunk to IndexedDB and returns the assigned id.
 */
export async function saveChunk(chunk: Omit<RecordingChunk, 'id'>): Promise<number> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, 'readwrite');
    const store = transaction.objectStore(CHUNKS_STORE);

    const request = store.add(chunk);

    request.onerror = () => {
      console.error('Failed to save chunk:', request.error);
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
 * Gets all chunks for a session, ordered by chunkIndex.
 */
export async function getChunksBySession(sessionId: string): Promise<RecordingChunk[]> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, 'readonly');
    const store = transaction.objectStore(CHUNKS_STORE);
    const index = store.index('sessionId');

    const chunks: RecordingChunk[] = [];
    const request = index.openCursor(IDBKeyRange.only(sessionId));

    request.onerror = () => {
      console.error('Failed to get chunks by session:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        chunks.push(cursor.value as RecordingChunk);
        cursor.continue();
      } else {
        // Sort by chunkIndex before returning
        chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
        resolve(chunks);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets all chunks that haven't been uploaded yet.
 */
export async function getPendingChunks(): Promise<RecordingChunk[]> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, 'readonly');
    const store = transaction.objectStore(CHUNKS_STORE);
    const index = store.index('uploaded');

    const chunks: RecordingChunk[] = [];
    const request = index.openCursor(IDBKeyRange.only(false));

    request.onerror = () => {
      console.error('Failed to get pending chunks:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        chunks.push(cursor.value as RecordingChunk);
        cursor.continue();
      } else {
        resolve(chunks);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Marks a chunk as uploaded.
 */
export async function markChunkUploaded(id: number): Promise<void> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, 'readwrite');
    const store = transaction.objectStore(CHUNKS_STORE);

    const getRequest = store.get(id);

    getRequest.onerror = () => {
      console.error('Failed to get chunk for update:', getRequest.error);
      reject(getRequest.error);
    };

    getRequest.onsuccess = () => {
      const chunk = getRequest.result as RecordingChunk;
      if (!chunk) {
        reject(new Error(`Chunk ${id} not found`));
        return;
      }

      chunk.uploaded = true;
      const putRequest = store.put(chunk);

      putRequest.onerror = () => {
        console.error('Failed to mark chunk uploaded:', putRequest.error);
        reject(putRequest.error);
      };

      putRequest.onsuccess = () => {
        resolve();
      };
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Deletes all chunks for a session.
 */
export async function deleteChunksBySession(sessionId: string): Promise<void> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHUNKS_STORE, 'readwrite');
    const store = transaction.objectStore(CHUNKS_STORE);
    const index = store.index('sessionId');

    const request = index.openCursor(IDBKeyRange.only(sessionId));

    request.onerror = () => {
      console.error('Failed to delete chunks by session:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Saves or updates session metadata.
 */
export async function saveSession(session: ContinuousSession): Promise<void> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);

    const request = store.put(session);

    request.onerror = () => {
      console.error('Failed to save session:', request.error);
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
 * Gets a session by sessionId.
 */
export async function getSession(sessionId: string): Promise<ContinuousSession | null> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);

    const request = store.get(sessionId);

    request.onerror = () => {
      console.error('Failed to get session:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve((request.result as ContinuousSession) || null);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets all sessions that are not complete or failed.
 */
export async function getActiveSessions(): Promise<ContinuousSession[]> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);

    const sessions: ContinuousSession[] = [];
    const request = store.openCursor();

    request.onerror = () => {
      console.error('Failed to get active sessions:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

      if (cursor) {
        const session = cursor.value as ContinuousSession;
        if (session.status !== 'complete' && session.status !== 'failed') {
          sessions.push(session);
        }
        cursor.continue();
      } else {
        resolve(sessions);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Updates a session's status.
 */
export async function updateSessionStatus(
  sessionId: string,
  status: ContinuousSession['status']
): Promise<void> {
  const db = await openChunkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);

    const getRequest = store.get(sessionId);

    getRequest.onerror = () => {
      console.error('Failed to get session for status update:', getRequest.error);
      reject(getRequest.error);
    };

    getRequest.onsuccess = () => {
      const session = getRequest.result as ContinuousSession;
      if (!session) {
        reject(new Error(`Session ${sessionId} not found`));
        return;
      }

      session.status = status;
      if (status === 'complete' || status === 'failed') {
        session.endTime = Date.now();
      }

      const putRequest = store.put(session);

      putRequest.onerror = () => {
        console.error('Failed to update session status:', putRequest.error);
        reject(putRequest.error);
      };

      putRequest.onsuccess = () => {
        resolve();
      };
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
