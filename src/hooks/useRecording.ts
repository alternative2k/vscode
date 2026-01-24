import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingState, Recording } from '../types/recording';

interface UseRecordingReturn {
  state: RecordingState;
  recording: Recording | null;
  duration: number;
  startRecording: () => void;
  stopRecording: () => void;
}

export function useRecording(stream: MediaStream | null): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Recording | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Clean up object URL when recording changes or unmount
  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Get supported MIME type
const getSupportedMimeType = useCallback((): string => {
    const types = [
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    // Fallback - let browser decide
    return '';
  }, []);

  const startRecording = useCallback(() => {
    if (!stream || state === 'recording') return;

    // Clean up previous recording
    cleanupObjectUrl();
    setRecording(null);
    chunksRef.current = [];

try {
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 500000 } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const recordingDuration = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );

        setRecording({
          blob,
          url,
          timestamp: new Date(),
          duration: recordingDuration,
        });
        setState('stopped');

        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorder.onerror = () => {
        setState('idle');
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      // Start recording with 1 second timeslice for periodic chunks
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();
      setDuration(0);
      setState('recording');

      // Update duration every second
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setState('idle');
    }
  }, [stream, state, cleanupObjectUrl, getSupportedMimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupObjectUrl();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [cleanupObjectUrl]);

// Reset state if stream changes (e.g., camera switch)
  useEffect(() => {
    if (state === 'recording' && mediaRecorderRef.current) {
      // Stop recording if stream changes mid-recording
      mediaRecorderRef.current.stop();
    }
    // Reset to idle when stream changes
    setState('idle');
    setDuration(0);
    // Keep the last recording available
  }, [stream, state]);

  return {
    state,
    recording,
    duration,
    startRecording,
    stopRecording,
  };
}
