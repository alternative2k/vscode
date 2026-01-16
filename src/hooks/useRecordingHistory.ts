import { useState, useEffect, useCallback } from 'react';
import type { Recording, StoredRecording, SavedRecording } from '../types/recording';
import {
  saveRecording as saveToDb,
  getAllRecordings,
  deleteRecording as deleteFromDb,
  getStorageStats,
} from '../utils/recordingStorage';

interface UseRecordingHistoryReturn {
  recordings: StoredRecording[];
  isLoading: boolean;
  error: string | null;
  saveRecording: (recording: Recording) => Promise<number>;
  deleteRecording: (id: number) => Promise<void>;
  refreshRecordings: () => Promise<void>;
  storageStats: { count: number; totalSize: number };
}

export function useRecordingHistory(): UseRecordingHistoryReturn {
  const [recordings, setRecordings] = useState<StoredRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({ count: 0, totalSize: 0 });

  /**
   * Loads all recordings from IndexedDB and updates storage stats.
   */
  const refreshRecordings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allRecordings, stats] = await Promise.all([
        getAllRecordings(),
        getStorageStats(),
      ]);

      setRecordings(allRecordings);
      setStorageStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recordings';
      setError(message);
      console.error('Failed to load recordings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Saves a Recording to IndexedDB and refreshes the list.
   * Returns the assigned id of the stored recording.
   */
  const saveRecording = useCallback(
    async (recording: Recording): Promise<number> => {
      setError(null);

      try {
        const savedRecording: SavedRecording = {
          blob: recording.blob,
          timestamp: recording.timestamp,
          duration: recording.duration,
          fileSize: recording.blob.size,
        };

        const id = await saveToDb(savedRecording);
        await refreshRecordings();
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save recording';
        setError(message);
        console.error('Failed to save recording:', err);
        throw err;
      }
    },
    [refreshRecordings]
  );

  /**
   * Deletes a recording from IndexedDB and refreshes the list.
   */
  const deleteRecording = useCallback(
    async (id: number): Promise<void> => {
      setError(null);

      try {
        await deleteFromDb(id);
        await refreshRecordings();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete recording';
        setError(message);
        console.error('Failed to delete recording:', err);
        throw err;
      }
    },
    [refreshRecordings]
  );

  // Load recordings on mount
  useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  return {
    recordings,
    isLoading,
    error,
    saveRecording,
    deleteRecording,
    refreshRecordings,
    storageStats,
  };
}
