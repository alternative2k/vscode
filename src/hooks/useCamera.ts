import { useState, useEffect, useRef, useCallback } from 'react';

type FacingMode = 'user' | 'environment';

interface UseCameraReturn {
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  facingMode: FacingMode;
  toggleCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const videoRef = useRef<HTMLVideoElement>(null!);

  const stopStream = useCallback((currentStream: MediaStream | null) => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startCamera = useCallback(async (facing: FacingMode) => {
    setIsLoading(true);
    setError(null);

    // Stop existing stream before starting new one
    if (stream) {
      stopStream(stream);
    }

try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640, max: 854 },
          height: { ideal: 480, max: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access to use FormCheck.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while accessing the camera.');
      }
    }
  }, [stream, stopStream]);

  const toggleCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Initial camera start
  useEffect(() => {
    startCamera(facingMode);

    // Cleanup on unmount
    return () => {
      stopStream(stream);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stream,
    error,
    isLoading,
    videoRef,
    facingMode,
    toggleCamera,
  };
}
