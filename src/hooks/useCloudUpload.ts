import { useState, useEffect, useCallback } from 'react';
import type { CloudConfig, UploadProgress, UploadStatus } from '../types/cloud';
import type { StoredRecording } from '../types/recording';
import {
  saveCloudConfig,
  getCloudConfig,
  clearCloudConfig,
  uploadToCloud,
} from '../utils/cloudUpload';

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
 * Return type for the useCloudUpload hook.
 */
export interface UseCloudUploadReturn {
  config: CloudConfig | null;
  isConfigured: boolean;
  enableCloud: () => void;
  disableCloud: () => void;
  uploads: UploadItem[];
  uploadRecording: (recording: StoredRecording) => Promise<void>;
  retryUpload: (id: number, recording: StoredRecording) => Promise<void>;
  isUploading: boolean;
}

/**
 * Hook for managing cloud uploads with presigned URLs.
 *
 * Unlike useS3Upload, this hook does NOT handle credentials - they stay server-side.
 * Config is simply { enabled: boolean }.
 */
export function useCloudUpload(): UseCloudUploadReturn {
  const [config, setConfig] = useState<CloudConfig | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Load config from localStorage on mount
  useEffect(() => {
    const storedConfig = getCloudConfig();
    setConfig(storedConfig);
  }, []);

  /**
   * Enables cloud uploads.
   */
  const enableCloud = useCallback(() => {
    const newConfig: CloudConfig = { enabled: true };
    saveCloudConfig(newConfig);
    setConfig(newConfig);
  }, []);

  /**
   * Disables cloud uploads and clears config.
   */
  const disableCloud = useCallback(() => {
    clearCloudConfig();
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
   * Uploads a recording to cloud storage.
   */
  const uploadRecording = useCallback(
    async (recording: StoredRecording): Promise<void> => {
      if (!config?.enabled) {
        throw new Error('Cloud upload is not enabled');
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
      const result = await uploadToCloud(
        recording.blob,
        fileName,
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
    isConfigured: config?.enabled === true,
    enableCloud,
    disableCloud,
    uploads,
    uploadRecording,
    retryUpload,
    isUploading,
  };
}
