import type { CloudConfig, UploadProgress, UploadResult, PresignedUrlResponse } from '../types/cloud';

const CLOUD_CONFIG_KEY = 'formcheck-cloud-config';

/**
 * Saves cloud configuration to localStorage.
 */
export function saveCloudConfig(config: CloudConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Retrieves cloud configuration from localStorage.
 * Returns null if not configured.
 */
export function getCloudConfig(): CloudConfig | null {
  const stored = localStorage.getItem(CLOUD_CONFIG_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as CloudConfig;
  } catch {
    console.error('Failed to parse cloud config from localStorage');
    return null;
  }
}

/**
 * Clears cloud configuration from localStorage.
 */
export function clearCloudConfig(): void {
  localStorage.removeItem(CLOUD_CONFIG_KEY);
}

/**
 * Delays execution for a specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns today's date as YYYY-MM-DD for folder organization.
 */
function getDateFolder(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns "2026-01-21"
}

/**
 * Uploads a chunk blob with session context in the filename.
 * Organizes chunks in folders by session ID on R2.
 *
 * @param blob - The chunk blob to upload
 * @param sessionId - The continuous recording session ID
 * @param chunkIndex - The index of this chunk in the session
 * @param userId - Optional user ID for per-user folder organization
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to upload result
 */
export async function uploadChunk(
  blob: Blob,
  sessionId: string,
  chunkIndex: number,
  userId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const dateFolder = getDateFolder();
  const userPrefix = userId ? `${userId}/` : '';
  const fileName = `${userPrefix}${dateFolder}/${sessionId}/chunk-${String(chunkIndex).padStart(4, '0')}.webm`;
  return uploadToCloud(blob, fileName, onProgress);
}

/**
 * Uploads a blob to R2 using presigned URLs.
 *
 * Two-step process:
 * 1. Fetch presigned URL from Pages Function (/api/upload-url)
 * 2. Upload directly to R2 using the presigned URL
 *
 * Implements retry logic with exponential backoff (1s, 2s, 4s).
 *
 * @param blob - The blob to upload
 * @param fileName - The file name for the upload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to upload result
 */
export async function uploadToCloud(
  blob: Blob,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const maxRetries = 3;
  const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  // Step 1: Get presigned URL from Pages Function
  let presignedResponse: PresignedUrlResponse;
  try {
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
      return { success: false, error: errorMessage };
    }

    presignedResponse = await response.json() as PresignedUrlResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get upload URL';
    return { success: false, error: message };
  }

  // Step 2: Upload to R2 using presigned URL with retry logic
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await attemptUpload(blob, presignedResponse.uploadUrl, onProgress);
      // Return with the object key for reference
      return { ...result, url: presignedResponse.objectKey };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        return { success: false, error: message };
      }

      // Wait before retrying
      await delay(backoffDelays[attempt]);
    }
  }

  // Should never reach here, but TypeScript needs a return
  return { success: false, error: 'Upload failed after retries' };
}

/**
 * Attempts a single upload using XMLHttpRequest.
 */
function attemptUpload(
  blob: Blob,
  url: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, url });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    // Handle network errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    // Handle timeout
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    // Handle abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    // Configure and send request
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', blob.type || 'video/webm');
    xhr.timeout = 300000; // 5 minute timeout for large files
    xhr.send(blob);
  });
}
