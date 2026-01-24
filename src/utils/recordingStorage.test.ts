import { describe, it, expect, beforeEach } from 'vitest';
import type { SavedRecording } from '../types/recording';
import {
  saveRecording,
  getAllRecordings,
  getRecording,
  deleteRecording,
  getStorageStats,
} from './recordingStorage';

describe('recordingStorage', () => {
  beforeEach(async () => {
    const db = await (await import('./recordingStorage')).openDatabase();
    const tx = db.transaction('recordings', 'readwrite');
    const store = tx.objectStore('recordings');
    await store.clear();
    tx.oncomplete = () => db.close();
  });

  it('saves and retrieves recording', async () => {
    const recording: SavedRecording = {
      blob: new Blob(['test'], { type: 'video/webm' }),
      timestamp: new Date(),
      duration: 10,
      fileSize: 4,
    };

    const id = await saveRecording(recording);
    const retrieved = await getRecording(id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.duration).toBe(10);
  });

  it('gets all recordings sorted newest first', async () => {
    const now = Date.now();

    await saveRecording({
      blob: new Blob(['test1'], { type: 'video/webm' }),
      timestamp: new Date(now - 1000),
      duration: 5,
      fileSize: 4,
    });

    await saveRecording({
      blob: new Blob(['test2'], { type: 'video/webm' }),
      timestamp: new Date(now),
      duration: 10,
      fileSize: 4,
    });

    const recordings = await getAllRecordings();

    expect(recordings).toHaveLength(2);
    expect(recordings[0].duration).toBe(10);
    expect(recordings[1].duration).toBe(5);
  });

  it('deletes recording', async () => {
    const recording: SavedRecording = {
      blob: new Blob(['test'], { type: 'video/webm' }),
      timestamp: new Date(),
      duration: 10,
      fileSize: 4,
    };

    const id = await saveRecording(recording);
    await deleteRecording(id);

    const retrieved = await getRecording(id);
    expect(retrieved).toBeNull();
  });

  it('gets storage stats', async () => {
    const blob = new Blob(['test'], { type: 'video/webm' });
    await saveRecording({
      blob,
      timestamp: new Date(),
      duration: 10,
      fileSize: blob.size,
    });

    const stats = await getStorageStats();

    expect(stats.count).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('returns null for non-existent recording', async () => {
    const recording = await getRecording(999);
    expect(recording).toBeNull();
  });
});