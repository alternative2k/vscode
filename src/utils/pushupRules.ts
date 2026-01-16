/**
 * Push-up form analysis utilities for real-time form detection
 *
 * NOTE: Push-up detection works best from side view (sagittal plane) for body line analysis.
 * Elbow flare detection is better from behind, but side view gives overall better results.
 * Users should position camera to the side for best form feedback.
 */

import {
  Landmark,
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
  LEFT_ELBOW,
  RIGHT_ELBOW,
  LEFT_WRIST,
  RIGHT_WRIST,
  LEFT_HIP,
  RIGHT_HIP,
  LEFT_ANKLE,
  RIGHT_ANKLE,
} from '../types/pose';
import { calculateAngle, isLandmarkVisible } from './postureRules';

// Push-up form thresholds
const PUSHUP_DEPTH_THRESHOLD = 100; // Elbow angle should be < 100 degrees at proper depth
const PUSHUP_HIP_SAG_THRESHOLD = 15; // Degrees hip drops below shoulder-ankle line
const PUSHUP_HIP_PIKE_THRESHOLD = 15; // Degrees hip rises above shoulder-ankle line
const PUSHUP_ELBOW_FLARE_THRESHOLD = 75; // Elbow angle relative to torso - should stay tucked

// Position detection thresholds
const HORIZONTAL_BODY_THRESHOLD = 0.3; // Max Y difference between shoulders and hips (normalized)
const PUSHUP_STANCE_THRESHOLD = 130; // Elbow angle below this suggests push-up position

export interface PushupFormAlert {
  type: 'pushup-depth' | 'pushup-hip-sag' | 'pushup-hip-pike' | 'pushup-elbow-flare';
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Calculate average elbow angle (shoulder-elbow-wrist angle)
 * Uses both arms if visible, falls back to one arm if only one visible
 */
export function getElbowAngle(landmarks: Landmark[]): number | null {
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];

  const leftVisible =
    isLandmarkVisible(leftShoulder) &&
    isLandmarkVisible(leftElbow) &&
    isLandmarkVisible(leftWrist);

  const rightVisible =
    isLandmarkVisible(rightShoulder) &&
    isLandmarkVisible(rightElbow) &&
    isLandmarkVisible(rightWrist);

  if (!leftVisible && !rightVisible) {
    return null;
  }

  let totalAngle = 0;
  let count = 0;

  if (leftVisible) {
    totalAngle += calculateAngle(leftShoulder, leftElbow, leftWrist);
    count++;
  }

  if (rightVisible) {
    totalAngle += calculateAngle(rightShoulder, rightElbow, rightWrist);
    count++;
  }

  return totalAngle / count;
}

/**
 * Calculate deviation of hip from the shoulder-ankle line
 * Positive = hip is above line (piking), Negative = hip is below line (sagging)
 * Returns angle in degrees
 */
export function getBodyLineAngle(landmarks: Landmark[]): number | null {
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftAnkle = landmarks[LEFT_ANKLE];
  const rightAnkle = landmarks[RIGHT_ANKLE];

  // Check visibility of key landmarks
  const shouldersVisible =
    isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);
  const anklesVisible =
    isLandmarkVisible(leftAnkle) && isLandmarkVisible(rightAnkle);

  if (!shouldersVisible || !hipsVisible || !anklesVisible) {
    return null;
  }

  // Calculate midpoints
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const ankleMidX = (leftAnkle.x + rightAnkle.x) / 2;

  // Calculate expected Y position of hip on shoulder-ankle line
  // Using linear interpolation
  const totalDistance = Math.sqrt(
    Math.pow(ankleMidX - shoulderMidX, 2) + Math.pow(ankleMidY - shoulderMidY, 2)
  );

  if (totalDistance < 0.01) {
    return null; // Too close together
  }

  // Distance from shoulder to hip along X axis
  const hipDistanceRatio =
    Math.sqrt(Math.pow(hipMidX - shoulderMidX, 2)) /
    Math.sqrt(Math.pow(ankleMidX - shoulderMidX, 2));

  const expectedHipY = shoulderMidY + (ankleMidY - shoulderMidY) * hipDistanceRatio;
  const hipDeviation = hipMidY - expectedHipY;

  // Convert to angle (simplified - using deviation as proportion of body length)
  const bodyLength = Math.abs(ankleMidY - shoulderMidY);
  if (bodyLength < 0.01) {
    return null;
  }

  // Deviation as degrees (rough approximation)
  const deviationAngle = Math.atan2(hipDeviation, bodyLength * 0.5) * (180 / Math.PI);

  return deviationAngle;
}

/**
 * Detect if user is in push-up stance
 * Criteria:
 * - Body roughly horizontal (shoulders and hips at similar Y level)
 * - Not standing upright
 * - Arms somewhat bent (wrists below shoulders)
 */
export function isPushupPosition(landmarks: Landmark[]): boolean {
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];

  // Check visibility
  const shouldersVisible =
    isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);

  if (!shouldersVisible || !hipsVisible) {
    return false;
  }

  // Calculate midpoints
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;

  // Check if body is roughly horizontal (shoulders and hips at similar Y)
  // In push-up, the Y values should be close
  const bodyYDiff = Math.abs(shoulderMidY - hipMidY);
  if (bodyYDiff > HORIZONTAL_BODY_THRESHOLD) {
    return false; // Body not horizontal enough
  }

  // Check arm position - at least one elbow should be visible and somewhat bent
  const leftArmVisible =
    isLandmarkVisible(leftElbow) && isLandmarkVisible(leftWrist);
  const rightArmVisible =
    isLandmarkVisible(rightElbow) && isLandmarkVisible(rightWrist);

  if (!leftArmVisible && !rightArmVisible) {
    return false;
  }

  // Get elbow angle to confirm arms are engaged
  const elbowAngle = getElbowAngle(landmarks);
  if (elbowAngle === null) {
    return false;
  }

  // In push-up position, elbows should be somewhat bent (< 180)
  // But not fully extended standing position
  if (elbowAngle > PUSHUP_STANCE_THRESHOLD) {
    return false; // Arms too straight - probably not in push-up
  }

  return true;
}

/**
 * Check push-up form and return alert if issues detected
 * Returns null if not in push-up position or form is good
 */
export function checkPushupForm(landmarks: Landmark[]): PushupFormAlert | null {
  // First verify we're in push-up position
  if (!isPushupPosition(landmarks)) {
    return null;
  }

  // Check hip sag (hips dropping below body line)
  const bodyLineAngle = getBodyLineAngle(landmarks);
  if (bodyLineAngle !== null) {
    // Positive angle means hip is below the line (sagging) in screen coordinates
    // Note: Y increases downward in screen coordinates
    if (bodyLineAngle > PUSHUP_HIP_SAG_THRESHOLD) {
      return {
        type: 'pushup-hip-sag',
        message: 'Hips sagging - tighten core',
        severity: 'warning',
      };
    }

    // Negative angle means hip is above the line (piking)
    if (bodyLineAngle < -PUSHUP_HIP_PIKE_THRESHOLD) {
      return {
        type: 'pushup-hip-pike',
        message: 'Hips too high - lower to straight line',
        severity: 'warning',
      };
    }
  }

  // Check elbow angle at bottom position for depth
  const elbowAngle = getElbowAngle(landmarks);
  if (elbowAngle !== null && elbowAngle < PUSHUP_STANCE_THRESHOLD) {
    // Only check depth if elbows are somewhat bent (in the down phase)
    if (elbowAngle > PUSHUP_DEPTH_THRESHOLD && elbowAngle < PUSHUP_STANCE_THRESHOLD - 10) {
      return {
        type: 'pushup-depth',
        message: 'Go deeper - lower chest',
        severity: 'warning',
      };
    }
  }

  // Check elbow flare (elbows going too far out from body)
  // This is best detected from behind, but we can approximate from side
  // by checking if elbows are significantly outside the shoulder-wrist line
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftElbow = landmarks[LEFT_ELBOW];
  const rightElbow = landmarks[RIGHT_ELBOW];
  const leftWrist = landmarks[LEFT_WRIST];
  const rightWrist = landmarks[RIGHT_WRIST];

  const leftVisible =
    isLandmarkVisible(leftShoulder) &&
    isLandmarkVisible(leftElbow) &&
    isLandmarkVisible(leftWrist);
  const rightVisible =
    isLandmarkVisible(rightShoulder) &&
    isLandmarkVisible(rightElbow) &&
    isLandmarkVisible(rightWrist);

  // Calculate elbow position relative to shoulder-wrist line (simplified check)
  if (leftVisible) {
    // Check if left elbow is flaring outward
    // Elbow should be close to the line between shoulder and wrist
    const expectedElbowX =
      (leftShoulder.x + leftWrist.x) / 2;
    const elbowDeviation = Math.abs(leftElbow.x - expectedElbowX);

    if (elbowDeviation > 0.1) {
      // Get the angle of the arm to check flare
      const armAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      if (armAngle < PUSHUP_ELBOW_FLARE_THRESHOLD) {
        return {
          type: 'pushup-elbow-flare',
          message: 'Elbows flaring - tuck them in',
          severity: 'warning',
        };
      }
    }
  }

  if (rightVisible) {
    const expectedElbowX =
      (rightShoulder.x + rightWrist.x) / 2;
    const elbowDeviation = Math.abs(rightElbow.x - expectedElbowX);

    if (elbowDeviation > 0.1) {
      const armAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      if (armAngle < PUSHUP_ELBOW_FLARE_THRESHOLD) {
        return {
          type: 'pushup-elbow-flare',
          message: 'Elbows flaring - tuck them in',
          severity: 'warning',
        };
      }
    }
  }

  // Form is good
  return null;
}
