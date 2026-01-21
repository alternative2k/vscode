export type RecordingState = 'idle' | 'recording' | 'stopped';

export interface Recording {
  blob: Blob;
  url: string;
  timestamp: Date;
  duration: number;
}

/**
 * A recording stored in IndexedDB with an auto-generated id.
 */
export interface StoredRecording {
  id: number;
  blob: Blob;
  timestamp: Date;
  duration: number;
  fileSize: number;
}

/**
 * A recording ready to be saved to IndexedDB (id will be auto-generated).
 */
export type SavedRecording = Omit<StoredRecording, 'id'>;

/**
 * A chunk from continuous recording, stored progressively in IndexedDB.
 */
export interface RecordingChunk {
  id?: number;
  sessionId: string;
  chunkIndex: number;
  blob: Blob;
  timestamp: number;
  uploaded: boolean;
  retryCount?: number; // Number of upload attempts (max 5)
}

/**
 * Session metadata for continuous recording.
 */
export interface ContinuousSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  status: 'recording' | 'uploading' | 'complete' | 'failed';
  totalChunks: number;
  uploadedChunks: number;
}

export type ContinuousRecordingState = 'idle' | 'recording' | 'paused' | 'uploading';
