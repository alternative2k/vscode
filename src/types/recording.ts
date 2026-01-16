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
