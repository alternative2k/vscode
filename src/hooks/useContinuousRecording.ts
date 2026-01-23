import { useState, useRef, useCallback, useEffect } from 'react';
import type { ContinuousRecordingState } from '../types/recording';
import {
  saveChunk,
  saveSession,
  getSession,
  updateSessionStatus,
  getPendingChunks,
  markChunkUploaded,
  getChunksBySession,
  updateChunk,
} from '../utils/chunkStorage';
import { uploadChunk } from '../utils/cloudUpload';

interface UseContinuousRecordingReturn {
  state: ContinuousRecordingState;
  isEnabled: boolean;
  sessionId: string | null;
  duration: number;
  chunkCount: number;
  uploadProgress: { uploaded: number; total: number };
  hasRetries: boolean;
  enable: () => void;
  disable: () => void;
  error: string | null;
}

interface UseContinuousRecordingOptions {
  autoStart?: boolean;
  userId?: string;  // User ID for cloud folder organization
}

/**
 * Finds the byte offset of the first WebM Cluster element in an ArrayBuffer.
 * WebM Cluster element ID is 0x1F43B675.
 * Returns -1 if no Cluster found.
 */
function findClusterOffset(buffer: ArrayBuffer): number {
  const view = new Uint8Array(buffer);
  // Cluster element ID: 0x1F, 0x43, 0xB6, 0x75
  for (let i = 0; i < view.length - 3; i++) {
    if (view[i] === 0x1F && view[i + 1] === 0x43 && view[i + 2] === 0xB6 && view[i + 3] === 0x75) {
      return i;
    }
  }
  return -1;
}

/**
 * Extracts the WebM initialization segment from the first chunk.
 * The init segment contains EBML header, Segment info, and Track info -
 * everything before the first Cluster element.
 */
function extractInitSegment(buffer: ArrayBuffer): ArrayBuffer | null {
  const clusterOffset = findClusterOffset(buffer);
  if (clusterOffset <= 0) {
    return null;
  }
  return buffer.slice(0, clusterOffset);
}

/**
 * Prepends the initialization segment to a chunk's data to make it independently playable.
 */
function prependInitSegment(initSegment: ArrayBuffer, chunkData: ArrayBuffer): Blob {
  return new Blob([initSegment, chunkData], { type: 'video/webm' });
}

// Get supported MIME type (same pattern as useRecording)
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}

export function useContinuousRecording(
  stream: MediaStream | null,
  options?: UseContinuousRecordingOptions
): UseContinuousRecordingReturn {
  const [state, setState] = useState<ContinuousRecordingState>('idle');
  const [isEnabled, setIsEnabled] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [hasRetries, setHasRetries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect low-end devices for performance optimization
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  
  useEffect(() => {
    const checkDeviceCapability = () => {
      // Detect low-end devices based on CPU cores and memory
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 4;
      setIsLowEndDevice(cores < 4 || memory < 4);
    };
    checkDeviceCapability();
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const isEnabledRef = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);
  // Store WebM initialization segment (EBML header + Segment info + Tracks) for prepending to subsequent chunks
  const initSegmentRef = useRef<ArrayBuffer | null>(null);

  // Keep refs in sync with state for use in event handlers
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Auto-enable recording when autoStart is true
  useEffect(() => {
    if (options?.autoStart) {
      setIsEnabled(true);
    }
  }, [options?.autoStart]);

// Maximum retry attempts per chunk
  const MAX_RETRIES = 5;

  // Adaptive chunk size based on device capability
const getChunkInterval = useCallback(() => {
    return isLowEndDevice ? 10000 : 5000; // 10s on low-end, 5s on high-end
  }, [isLowEndDevice]);

  // Upload pending chunks for a session with retry logic
  const uploadPendingChunks = useCallback(async (forSessionId: string) => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    try {
      const chunks = await getChunksBySession(forSessionId);
      // Filter to pending chunks that haven't exceeded max retries
      const pendingChunks = chunks.filter(c => !c.uploaded && (c.retryCount ?? 0) < MAX_RETRIES);

      if (pendingChunks.length === 0) {
        isUploadingRef.current = false;
        return;
      }

      // Check if any chunks are being retried
      const hasRetriesInBatch = pendingChunks.some(c => (c.retryCount ?? 0) > 0);
      setHasRetries(hasRetriesInBatch);

      setState('uploading');
      setUploadProgress({ uploaded: 0, total: pendingChunks.length });

      let uploadedCount = 0;
      for (const chunk of pendingChunks) {
        try {
          const result = await uploadChunk(chunk.blob, forSessionId, chunk.chunkIndex, options?.userId);
          if (result.success && chunk.id !== undefined) {
            await markChunkUploaded(chunk.id);
            uploadedCount++;
            setUploadProgress({ uploaded: uploadedCount, total: pendingChunks.length });
          } else if (chunk.id !== undefined) {
            // Upload failed - increment retry count and save back to IndexedDB
            const newRetryCount = (chunk.retryCount ?? 0) + 1;
            chunk.retryCount = newRetryCount;
            await updateChunk(chunk);

            if (newRetryCount >= MAX_RETRIES) {
              console.error(`Chunk ${chunk.chunkIndex} exceeded max retries (${MAX_RETRIES}), giving up`);
            }
          }
        } catch (err) {
          console.error('Failed to upload chunk:', err);
          // Increment retry count on exception
          if (chunk.id !== undefined) {
            const newRetryCount = (chunk.retryCount ?? 0) + 1;
            chunk.retryCount = newRetryCount;
            await updateChunk(chunk);

            if (newRetryCount >= MAX_RETRIES) {
              console.error(`Chunk ${chunk.chunkIndex} exceeded max retries (${MAX_RETRIES}), giving up`);
            }
          }
        }
      }

      // Update session with upload count
      const session = await getSession(forSessionId);
      if (session) {
        session.uploadedChunks = uploadedCount;
        await saveSession(session);
      }

      // If all original pending chunks uploaded, mark session complete
      const remainingPending = (await getChunksBySession(forSessionId)).filter(c => !c.uploaded && (c.retryCount ?? 0) < MAX_RETRIES);
      if (remainingPending.length === 0) {
        await updateSessionStatus(forSessionId, 'complete');
      }
    } catch (err) {
      console.error('Error during chunk upload:', err);
    } finally {
      isUploadingRef.current = false;
      setHasRetries(false);
      // Return to recording state if still enabled and recording
      if (mediaRecorderRef.current?.state === 'recording') {
        setState('recording');
      } else if (isEnabledRef.current) {
        setState('paused');
      } else {
        setState('idle');
      }
    }
  }, [options?.userId]);

  // Start a new recording session
  const startRecording = useCallback(async () => {
    if (!stream || mediaRecorderRef.current?.state === 'recording') return;

    try {
      const newSessionId = `continuous-${Date.now()}`;
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      chunkIndexRef.current = 0;
      initSegmentRef.current = null; // Reset init segment for new session
      setChunkCount(0);
      setError(null);

      // Create session in IndexedDB
      await saveSession({
        sessionId: newSessionId,
        startTime: Date.now(),
        status: 'recording',
        totalChunks: 0,
        uploadedChunks: 0,
      });

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && sessionIdRef.current) {
          const currentChunkIndex = chunkIndexRef.current++;

          try {
            let blobToSave: Blob;

            if (currentChunkIndex === 0) {
              // First chunk: extract and store the init segment, save full chunk as-is
              const arrayBuffer = await event.data.arrayBuffer();
              const initSegment = extractInitSegment(arrayBuffer);
              if (initSegment) {
                initSegmentRef.current = initSegment;
              }
              blobToSave = event.data;
            } else if (initSegmentRef.current) {
              // Subsequent chunks: prepend init segment to make independently playable
              const arrayBuffer = await event.data.arrayBuffer();
              blobToSave = prependInitSegment(initSegmentRef.current, arrayBuffer);
            } else {
              // Fallback: no init segment available, save raw (won't be playable standalone)
              blobToSave = event.data;
            }

            // Save chunk to IndexedDB immediately (don't accumulate in memory)
            await saveChunk({
              sessionId: sessionIdRef.current,
              chunkIndex: currentChunkIndex,
              blob: blobToSave,
              timestamp: Date.now(),
              uploaded: false,
            });

            setChunkCount(prev => prev + 1);

            // Update session metadata
            const session = await getSession(sessionIdRef.current);
            if (session) {
              session.totalChunks = currentChunkIndex + 1;
              await saveSession(session);
            }
          } catch (err) {
            console.error('Failed to save chunk:', err);
            // Continue recording even if save fails (graceful degradation)
          }
        }
      };

      mediaRecorder.onerror = () => {
        setError('MediaRecorder error');
        setState('idle');
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorder.onstop = async () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Upload pending chunks when recording stops
        if (sessionIdRef.current) {
          await uploadPendingChunks(sessionIdRef.current);
        }
      };

      // Start recording with 5 second timeslice for continuous chunks
      mediaRecorder.start(5000);
      startTimeRef.current = Date.now();
      setDuration(0);
      setState('recording');

      // Update duration every second
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setState('idle');
    }
  }, [stream, uploadPendingChunks]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Enable continuous recording
  const enable = useCallback(() => {
    setIsEnabled(true);
    setError(null);
  }, []);

  // Disable continuous recording
  const disable = useCallback(() => {
    setIsEnabled(false);
    stopRecording();
  }, [stopRecording]);

  // Auto-start when enabled and stream available
  useEffect(() => {
    if (isEnabled && stream && state === 'idle') {
      startRecording();
    }
  }, [isEnabled, stream, state, startRecording]);

  // Handle visibility change - THE critical event for page exit
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving - stop recorder and upload
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          // onstop handler will trigger upload
        }
      } else if (document.visibilityState === 'visible') {
        // User returned - start new session if still enabled
        if (isEnabledRef.current && stream && !mediaRecorderRef.current?.state) {
          startRecording();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stream, startRecording]);

  // Reset when stream changes
  useEffect(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (isEnabled && stream) {
      // Will auto-start via the isEnabled effect
      setState('idle');
    }
  }, [stream, isEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Check for pending uploads from previous sessions on mount
  useEffect(() => {
    const uploadPreviousSessionChunks = async () => {
      try {
        const pending = await getPendingChunks();
        if (pending.length > 0) {
          // Group by sessionId and upload
          const sessionIds = [...new Set(pending.map(c => c.sessionId))];
          for (const sid of sessionIds) {
            await uploadPendingChunks(sid);
          }
        }
      } catch (err) {
        console.error('Failed to upload previous session chunks:', err);
      }
    };

    uploadPreviousSessionChunks();
  }, [uploadPendingChunks]);

  // Network reconnection listener - retry pending uploads when online
  useEffect(() => {
    const handleOnline = () => {
      // Network came back - retry any pending chunks
      if (sessionIdRef.current) {
        uploadPendingChunks(sessionIdRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [uploadPendingChunks]);

  return {
    state,
    isEnabled,
    sessionId,
    duration,
    chunkCount,
    uploadProgress,
    hasRetries,
    enable,
    disable,
    error,
  };
}
