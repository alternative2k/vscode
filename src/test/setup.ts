import '@testing-library/jest-dom';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

(globalThis as typeof globalThis & { indexedDB: typeof indexedDB; IDBKeyRange: typeof IDBKeyRange }).indexedDB = indexedDB;
(globalThis as typeof globalThis & { indexedDB: typeof indexedDB; IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;