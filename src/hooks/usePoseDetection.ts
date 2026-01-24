import { useState, useEffect, useRef, useCallback } from 'react';
import { Pose, Results } from '@mediapipe/pose';
import { Landmark } from '../types/pose';

type FacingMode = 'user' | 'environment';

interface UsePoseDetectionReturn {
  landmarks: Landmark[] | null;
  isDetecting: boolean;
}

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  facingMode: FacingMode = 'user'
): UsePoseDetectionReturn {
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef(0);
  const PROCESSING_INTERVAL = 66;

  // Store facingMode in a ref to avoid recreating pose instance
  const facingModeRef = useRef(facingMode);
  facingModeRef.current = facingMode;

  // Poll for video element since ref.current doesn't trigger re-renders
  useEffect(() => {
    const checkForVideo = () => {
      if (videoRef.current && !videoElement) {
        setVideoElement(videoRef.current);
      }
    };

    // Check immediately
    checkForVideo();

    // Also check periodically in case it appears later
    const interval = setInterval(checkForVideo, 100);

    return () => clearInterval(interval);
  }, [videoRef, videoElement]);

  // Handle pose results - use ref to avoid dependency on facingMode
  const onResults = useCallback((results: Results) => {
    if (results.poseLandmarks) {
      // Transform landmarks based on facing mode
      // When using front camera (user), we need to flip x coordinates
      // because the video is mirrored with scaleX(-1)
      const currentFacingMode = facingModeRef.current;
      const transformedLandmarks = results.poseLandmarks.map((landmark) => ({
        x: currentFacingMode === 'user' ? 1 - landmark.x : landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility ?? 0,
      }));
      setLandmarks(transformedLandmarks);
    } else {
      setLandmarks(null);
    }
  }, []);

  // Initialize MediaPipe Pose (only once on mount)
  useEffect(() => {
    const poseInstance = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    poseInstance.setOptions({
      modelComplexity: 1, // 0=lite, 1=full, 2=heavy
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseInstance.onResults(onResults);
    setPose(poseInstance);

    return () => {
      poseInstance.close();
      setPose(null);
    };
  }, [onResults]);

  // Detection loop using requestAnimationFrame
  useEffect(() => {
    if (!videoElement || !pose) {
      return;
    }

    let isRunning = true;

const detectPose = async () => {
      if (!isRunning || !videoElement || !pose) {
        return;
      }

      const now = Date.now();
      const timeSinceLastProcess = now - lastProcessTimeRef.current;

      // Rate limit pose detection on mobile devices
      if (timeSinceLastProcess < PROCESSING_INTERVAL) {
        if (isRunning) {
          animationFrameRef.current = requestAnimationFrame(detectPose);
        }
        return;
      }

      // Check if video is ready (readyState >= 2 means HAVE_CURRENT_DATA)
      if (videoElement.readyState >= 2) {
        setIsDetecting(true);
        lastProcessTimeRef.current = now;
        try {
          await pose.send({ image: videoElement });
        } catch {
          // Silently handle errors during detection
          // This can happen during camera switching or unmounting
        }
      }

      // Schedule next frame
      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(detectPose);
      }
    };

    // Start detection loop
    detectPose();

    return () => {
      isRunning = false;
      setIsDetecting(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [videoElement, pose]);

  return {
    landmarks,
    isDetecting,
  };
}
