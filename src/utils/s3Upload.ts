import type { S3Config, UploadProgress, UploadResult } from '../types/s3';

const S3_CONFIG_KEY = 'formcheck-s3-config';

/**
 * Saves S3 configuration to localStorage.
 */
export function saveS3Config(config: S3Config): void {
  localStorage.setItem(S3_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Retrieves S3 configuration from localStorage.
 * Returns null if not configured.
 */
export function getS3Config(): S3Config | null {
  const stored = localStorage.getItem(S3_CONFIG_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as S3Config;
  } catch {
    console.error('Failed to parse S3 config from localStorage');
    return null;
  }
}

/**
 * Clears S3 configuration from localStorage.
 */
export function clearS3Config(): void {
  localStorage.removeItem(S3_CONFIG_KEY);
}

/**
 * Delays execution for a specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Uploads a blob to S3 using XMLHttpRequest for progress tracking.
 * Uses PUT request to public bucket (configured with CORS for anonymous writes).
 *
 * Implements retry logic with exponential backoff (1s, 2s, 4s).
 *
 * @param blob - The blob to upload
 * @param fileName - The file name (key) in S3
 * @param config - S3 configuration
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to upload result
 */
export async function uploadToS3(
  blob: Blob,
  fileName: string,
  config: S3Config,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const maxRetries = 3;
  const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${fileName}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await attemptUpload(blob, url, onProgress);
      return result;
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
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');
    xhr.timeout = 300000; // 5 minute timeout for large files
    xhr.send(blob);
  });
}
