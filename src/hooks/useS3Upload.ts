import { useState, useEffect, useCallback } from 'react';
import type { S3Config, UploadProgress, UploadStatus } from '../types/s3';
import type { StoredRecording } from '../types/recording';
import {
  saveS3Config as saveConfigToStorage,
  getS3Config,
  clearS3Config as clearConfigFromStorage,
  uploadToS3,
} from '../utils/s3Upload';

/**
 * Represents an upload operation for a recording.
 */
export interface UploadItem {
  id: number; // Recording id from IndexedDB
  status: UploadStatus;
  progress: UploadProgress;
  error?: string;
}

/**
 * Return type for the useS3Upload hook.
 */
export interface UseS3UploadReturn {
  config: S3Config | null;
  isConfigured: boolean;
  saveConfig: (config: S3Config) => void;
  clearConfig: () => void;
  uploads: UploadItem[];
  uploadRecording: (recording: StoredRecording) => Promise<void>;
  retryUpload: (id: number, recording: StoredRecording) => Promise<void>;
  isUploading: boolean;
}

/**
 * Hook for managing S3 uploads with config persistence and progress tracking.
 */
export function useS3Upload(): UseS3UploadReturn {
  const [config, setConfig] = useState<S3Config | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Load config from localStorage on mount
  useEffect(() => {
    const storedConfig = getS3Config();
    setConfig(storedConfig);
  }, []);

  /**
   * Saves S3 configuration to localStorage and state.
   */
  const saveConfig = useCallback((newConfig: S3Config) => {
    saveConfigToStorage(newConfig);
    setConfig(newConfig);
  }, []);

  /**
   * Clears S3 configuration from localStorage and state.
   */
  const clearConfig = useCallback(() => {
    clearConfigFromStorage();
    setConfig(null);
  }, []);

  /**
   * Generates a unique file name for a recording.
   */
  const generateFileName = (recording: StoredRecording): string => {
    const timestamp = recording.timestamp instanceof Date
      ? recording.timestamp.getTime()
      : new Date(recording.timestamp).getTime();
    return `formcheck-${recording.id}-${timestamp}.webm`;
  };

  /**
   * Updates an upload item in the uploads array.
   */
  const updateUpload = useCallback(
    (id: number, updates: Partial<UploadItem>) => {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  /**
   * Uploads a recording to S3.
   */
  const uploadRecording = useCallback(
    async (recording: StoredRecording): Promise<void> => {
      if (!config) {
        throw new Error('S3 is not configured');
      }

      const fileName = generateFileName(recording);

      // Add to uploads array as pending
      const newUpload: UploadItem = {
        id: recording.id,
        status: 'pending',
        progress: { loaded: 0, total: recording.fileSize, percentage: 0 },
      };

      setUploads((prev) => {
        // Replace existing upload for this id or add new
        const existing = prev.find((item) => item.id === recording.id);
        if (existing) {
          return prev.map((item) =>
            item.id === recording.id ? newUpload : item
          );
        }
        return [...prev, newUpload];
      });

      // Update status to uploading
      updateUpload(recording.id, { status: 'uploading' });

      // Perform upload
      const result = await uploadToS3(
        recording.blob,
        fileName,
        config,
        (progress) => {
          updateUpload(recording.id, { progress });
        }
      );

      // Update final status
      if (result.success) {
        updateUpload(recording.id, {
          status: 'complete',
          progress: {
            loaded: recording.fileSize,
            total: recording.fileSize,
            percentage: 100,
          },
        });
      } else {
        updateUpload(recording.id, {
          status: 'failed',
          error: result.error,
        });
      }
    },
    [config, updateUpload]
  );

  /**
   * Retries a failed upload.
   */
  const retryUpload = useCallback(
    async (id: number, recording: StoredRecording): Promise<void> => {
      // Reset status to pending before retrying
      updateUpload(id, {
        status: 'pending',
        error: undefined,
        progress: { loaded: 0, total: recording.fileSize, percentage: 0 },
      });

      await uploadRecording(recording);
    },
    [uploadRecording, updateUpload]
  );

  // Computed: check if any upload is in progress
  const isUploading = uploads.some((item) => item.status === 'uploading');

  return {
    config,
    isConfigured: config !== null,
    saveConfig,
    clearConfig,
    uploads,
    uploadRecording,
    retryUpload,
    isUploading,
  };
}
