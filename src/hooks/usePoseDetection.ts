import { useState, useEffect, useRef, useCallback } from 'react';
import { Pose, Results } from '@mediapipe/pose';
import { Landmark } from '../types/pose';

type FacingMode = 'user' | 'environment';

interface UsePoseDetectionReturn {
  landmarks: Landmark[] | null;
  isDetecting: boolean;
}

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  facingMode: FacingMode = 'user'
): UsePoseDetectionReturn {
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle pose results
  const onResults = useCallback((results: Results) => {
    if (results.poseLandmarks) {
      // Transform landmarks based on facing mode
      // When using front camera (user), we need to flip x coordinates
      // because the video is mirrored with scaleX(-1)
      const transformedLandmarks = results.poseLandmarks.map((landmark) => ({
        x: facingMode === 'user' ? 1 - landmark.x : landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility ?? 0,
      }));
      setLandmarks(transformedLandmarks);
    } else {
      setLandmarks(null);
    }
  }, [facingMode]);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1, // 0=lite, 1=full, 2=heavy
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    return () => {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, [onResults]);

  // Detection loop using requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    const pose = poseRef.current;

    if (!video || !pose) {
      return;
    }

    let isRunning = true;

    const detectPose = async () => {
      if (!isRunning || !video || !pose) {
        return;
      }

      // Check if video is ready (readyState >= 2 means HAVE_CURRENT_DATA)
      if (video.readyState >= 2) {
        setIsDetecting(true);
        try {
          await pose.send({ image: video });
        } catch (error) {
          // Silently handle errors during detection
          // This can happen during camera switching or unmounting
          console.debug('Pose detection frame skipped:', error);
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
  }, [videoRef]);

  return {
    landmarks,
    isDetecting,
  };
}
