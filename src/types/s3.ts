/**
 * Configuration for S3 bucket connection.
 * User provides their own bucket credentials for cloud backup.
 */
export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Progress information during upload.
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Status of an upload operation.
 */
export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

/**
 * Result of an upload operation.
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}
