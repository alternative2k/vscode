/**
 * Posture analysis utilities for general form detection
 * These rules detect obviously wrong postures - specific exercise form analysis is in Phase 4
 */

import {
  Landmark,
  NOSE,
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
  LEFT_HIP,
  RIGHT_HIP,
} from '../types/pose';

// Visibility threshold for considering a landmark reliable
const VISIBILITY_THRESHOLD = 0.5;

// Posture thresholds (kept lenient for general posture)
const SHOULDER_UNEVEN_THRESHOLD = 0.1; // Normalized Y difference
const BODY_TWIST_THRESHOLD = 20; // Degrees
const LEAN_THRESHOLD = 0.15; // Normalized Z difference

export interface PostureAlert {
  type: string;
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Calculate angle at p2 between points p1-p2-p3
 * Returns angle in degrees (0-180)
 */
export function calculateAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Check if landmark visibility meets threshold
 */
export function isLandmarkVisible(landmark: Landmark, threshold = VISIBILITY_THRESHOLD): boolean {
  return landmark.visibility >= threshold;
}

/**
 * Calculate angle of a line between two points relative to horizontal
 */
function getLineAngle(p1: Landmark, p2: Landmark): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Check general posture and return alert if issues detected
 * Returns null if posture is acceptable
 */
export function checkGeneralPosture(landmarks: Landmark[]): PostureAlert | null {
  // Get key landmarks
  const nose = landmarks[NOSE];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];

  // Check if key landmarks are visible
  const shouldersVisible =
    isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);

  // Rule d: Key landmarks missing - body not fully visible
  if (!shouldersVisible || !hipsVisible) {
    return {
      type: 'visibility',
      message: 'Step back - full body not visible',
      severity: 'warning',
    };
  }

  // Rule a: Shoulders uneven - significant Y difference
  const shoulderYDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  if (shoulderYDiff > SHOULDER_UNEVEN_THRESHOLD) {
    return {
      type: 'uneven',
      message: 'Shoulders uneven - stand straight',
      severity: 'warning',
    };
  }

  // Rule c: Body twisted - shoulder line vs hip line angle difference
  const shoulderAngle = getLineAngle(leftShoulder, rightShoulder);
  const hipAngle = getLineAngle(leftHip, rightHip);
  const twistAngle = Math.abs(shoulderAngle - hipAngle);
  if (twistAngle > BODY_TWIST_THRESHOLD) {
    return {
      type: 'twisted',
      message: 'Body twisted - face the camera',
      severity: 'warning',
    };
  }

  // Rule b: Leaning too far forward/back - nose Z vs shoulder midpoint Z
  if (isLandmarkVisible(nose)) {
    const shoulderMidpointZ = (leftShoulder.z + rightShoulder.z) / 2;
    const leanDiff = Math.abs(nose.z - shoulderMidpointZ);
    if (leanDiff > LEAN_THRESHOLD) {
      return {
        type: 'leaning',
        message: 'Leaning too far - center yourself',
        severity: 'warning',
      };
    }
  }

  // Posture is acceptable
  return null;
}
