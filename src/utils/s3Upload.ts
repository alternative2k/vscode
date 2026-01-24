import type { S3Config, UploadProgress, UploadResult } from '../types/s3';
import { uploadWithRetry, attemptUpload, createSecureStorage } from './uploadUtils';

const S3_CONFIG_KEY = 'formcheck-s3-config';

export const {
  save: saveS3Config,
  get: getS3Config,
  clear: clearS3Config,
} = createSecureStorage<S3Config>(S3_CONFIG_KEY);

export async function uploadToS3(
  blob: Blob,
  fileName: string,
  config: S3Config,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${fileName}`;

  return uploadWithRetry(async () =>
    attemptUpload({
      blob,
      url,
      onProgress,
      timeoutMs: 300000,
      contentType: blob.type || 'application/octet-stream',
    })
  );
}