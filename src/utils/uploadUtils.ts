export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDateFolder(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000];

export async function uploadWithRetry(
  uploadFn: () => Promise<UploadResult>,
  maxRetries: number = MAX_RETRIES
): Promise<UploadResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await uploadFn();
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        return { success: false, error: message };
      }

      await delay(BACKOFF_DELAYS[attempt]);
    }
  }

  return { success: false, error: 'Upload failed after retries' };
}

const MIN_TIMEOUT = 60000;

export function getAdaptiveTimeout(blob: Blob, minSeconds: number = MIN_TIMEOUT): number {
  const fileSizeInMB = blob.size / (1024 * 1024);
  return Math.max(minSeconds, fileSizeInMB * 10000);
}

export interface UploadHandler {
  blob: Blob;
  url: string;
  onProgress?: (progress: UploadProgress) => void;
  timeoutMs?: number;
  contentType: string;
}

export async function attemptUpload({
  blob,
  url,
  onProgress,
  timeoutMs,
  contentType,
}: UploadHandler): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, url });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    if (timeoutMs) {
      xhr.timeout = timeoutMs;
    }
    xhr.send(blob);
  });
}

export interface ConfigStorage<T> {
  save(config: T): void;
  get(): T | null;
  clear(): void;
}

export function createConfigStorage<T>(key: string): ConfigStorage<T> {
  return {
    save(config: T): void {
      const data = JSON.stringify(config);
      try {
        sessionStorage.setItem(key, data);
      } catch (e) {
        console.error(`Failed to save config to sessionStorage: ${e}`);
      }
    },
    get(): T | null {
      const stored = sessionStorage.getItem(key);
      if (!stored) {
        return null;
      }

      try {
        return JSON.parse(stored) as T;
      } catch (e) {
        console.error(`Failed to parse config from sessionStorage: ${e}`);
        return null;
      }
    },
    clear(): void {
      sessionStorage.removeItem(key);
    },
  };
}

export const CREDENTIALS_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSecureStorage<T>(key: string, expiryMs: number = CREDENTIALS_EXPIRY_MS): ConfigStorage<T> {
  return {
    save(config: T): void {
      const expiryTimestamp = Date.now() + expiryMs;
      const data = JSON.stringify({
        value: config,
        expiry: expiryTimestamp,
      });
      try {
        sessionStorage.setItem(key, data);
      } catch (e) {
        console.error(`Failed to save config to session storage: ${e}`);
      }
    },
    get(): T | null {
      const stored = sessionStorage.getItem(key);

      if (!stored) {
        return null;
      }

      try {
        const parsed = JSON.parse(stored) as { value: T; expiry: number };

        if (parsed.expiry && parsed.expiry < Date.now()) {
          sessionStorage.removeItem(key);
          return null;
        }

        return parsed.value;
      } catch (e) {
        console.error(`Failed to parse config: ${e}`);
        return null;
      }
    },
    clear(): void {
      sessionStorage.removeItem(key);
    },
  };
}