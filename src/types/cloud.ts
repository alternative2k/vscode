/**
 * Configuration for cloud upload.
 * Unlike S3Config, credentials are NOT stored client-side.
 * The backend (Pages Function) handles all credential management.
 */
export interface CloudConfig {
  enabled: boolean;
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

/**
 * Response from the presigned URL generation endpoint.
 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}
