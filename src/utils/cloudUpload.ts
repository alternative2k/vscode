import type { CloudConfig, UploadProgress, UploadResult, PresignedUrlResponse } from '../types/cloud';
import {
  getDateFolder as getDateFolderUtil,
  uploadWithRetry,
  getAdaptiveTimeout,
  attemptUpload,
  createSecureStorage,
} from './uploadUtils';

const CLOUD_CONFIG_KEY = 'formcheck-cloud-config';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 100;
const INITIAL_BATCH_DELAY_MS = 500;

export const {
  save: saveCloudConfig,
  get: getCloudConfig,
  clear: clearCloudConfig,
} = createSecureStorage<CloudConfig>(CLOUD_CONFIG_KEY);

interface QueuedUpload {
  blob: Blob;
  fileName: string;
  onProgress?: (progress: UploadProgress) => void;
  resolve: (result: UploadResult) => void;
}

const uploadQueue: QueuedUpload[] = [];
let isBatchUploading = false;
let batchTimer: ReturnType<typeof setTimeout> | null = null;

async function processBatchUpload(): Promise<void> {
  if (isBatchUploading || uploadQueue.length === 0) {
    return;
  }

  isBatchUploading = true;

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  const batch = uploadQueue.splice(0, BATCH_SIZE);

  const results = await Promise.all(
    batch.map(({ blob, fileName, onProgress }) =>
      uploadToCloud(blob, fileName, onProgress)
    )
  );

  batch.forEach((item, index) => {
    item.resolve(results[index]);
  });

  isBatchUploading = false;

  if (uploadQueue.length > 0) {
    batchTimer = window.setTimeout(processBatchUpload, BATCH_DELAY_MS);
  }
}

export async function uploadChunk(
  blob: Blob,
  sessionId: string,
  chunkIndex: number,
  userId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const dateFolder = getDateFolderUtil();
  const userPrefix = userId ? `${userId}/` : '';
  const fileName = `${userPrefix}${dateFolder}/${sessionId}/chunk-${String(chunkIndex).padStart(4, '0')}.webm`;

  return new Promise((resolve) => {
    uploadQueue.push({ blob, fileName, onProgress, resolve });
    if (!batchTimer) {
      batchTimer = window.setTimeout(processBatchUpload, INITIAL_BATCH_DELAY_MS);
    }
  });
}

export async function uploadToCloud(
  blob: Blob,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const fetchPresignedUrl = async (): Promise<PresignedUrlResponse> => {
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        contentType: blob.type || 'video/webm',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as { error?: string }).error || `Failed to get upload URL: ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as PresignedUrlResponse;
  };

  try {
    const presignedResponse = await fetchPresignedUrl();

    return await uploadWithRetry(async () => {
      const timeoutMs = getAdaptiveTimeout(blob, 60000);
      const result = await attemptUpload({
        blob,
        url: presignedResponse.uploadUrl,
        onProgress,
        timeoutMs,
        contentType: blob.type || 'video/webm',
      });
      return { ...result, url: presignedResponse.objectKey };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get upload URL';
    return { success: false, error: message };
  }
}