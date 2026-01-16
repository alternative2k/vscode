export type RecordingState = 'idle' | 'recording' | 'stopped';

export interface Recording {
  blob: Blob;
  url: string;
  timestamp: Date;
  duration: number;
}
