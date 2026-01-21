/**
 * Squat form analysis utilities for real-time form detection
 * Detects common squat issues: knee cave, forward lean, insufficient depth, asymmetry
 */

import {
  Landmark,
  LEFT_HIP,
  RIGHT_HIP,
  LEFT_KNEE,
  RIGHT_KNEE,
  LEFT_ANKLE,
  RIGHT_ANKLE,
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
} from '../types/pose';
import { calculateAngle, isLandmarkVisible } from './postureRules';

// Squat form thresholds
const SQUAT_DEPTH_THRESHOLD = 100; // Knee angle should be < 100 degrees at proper depth
const SQUAT_KNEE_CAVE_THRESHOLD = 0.05; // Normalized X - knees shouldn't move inward past ankle line
const SQUAT_FORWARD_LEAN_THRESHOLD = 45; // Torso angle from vertical in degrees
const SQUAT_POSITION_THRESHOLD = 150; // Knee angle to detect if user is in squat stance
const SQUAT_ASYMMETRIC_THRESHOLD = 15; // Degrees difference between left/right knee angles

export interface SquatFormAlert {
  type: 'squat-depth' | 'squat-knee-cave' | 'squat-forward-lean' | 'squat-asymmetric';
  message: string;
  severity: 'warning' | 'error';
  affectedLandmarks: number[];
}

/**
 * Calculate knee angle (hip-knee-ankle)
 * Returns angle in degrees (0-180)
 */
export function getKneeAngle(
  hip: Landmark,
  knee: Landmark,
  ankle: Landmark
): number {
  return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate torso angle from vertical (hip-shoulder line vs vertical)
 * Returns angle in degrees (0 = upright, positive = leaning forward)
 */
export function getTorsoAngle(landmarks: Landmark[]): number {
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];

  // Calculate midpoints
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  // Calculate angle from vertical (note: y increases downward in screen coords)
  // A vertical torso would have dx ~= 0
  const dx = shoulderMidX - hipMidX;
  const dy = hipMidY - shoulderMidY; // Inverted because y increases downward

  // Angle from vertical: 0 = perfectly upright
  const angleFromVertical = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI));
  return angleFromVertical;
}

/**
 * Detect if user is in squat stance (both knees bent below threshold)
 */
export function isSquatPosition(landmarks: Landmark[]): boolean {
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftKnee = landmarks[LEFT_KNEE];
  const rightKnee = landmarks[RIGHT_KNEE];
  const leftAnkle = landmarks[LEFT_ANKLE];
  const rightAnkle = landmarks[RIGHT_ANKLE];

  // Check visibility of required landmarks
  const leftLegVisible =
    isLandmarkVisible(leftHip) &&
    isLandmarkVisible(leftKnee) &&
    isLandmarkVisible(leftAnkle);
  const rightLegVisible =
    isLandmarkVisible(rightHip) &&
    isLandmarkVisible(rightKnee) &&
    isLandmarkVisible(rightAnkle);

  // Need at least one leg visible
  if (!leftLegVisible && !rightLegVisible) {
    return false;
  }

  // Check knee angles - both should be bent if both visible
  if (leftLegVisible && rightLegVisible) {
    const leftKneeAngle = getKneeAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = getKneeAngle(rightHip, rightKnee, rightAnkle);
    // Both knees need to be bent below threshold
    return leftKneeAngle < SQUAT_POSITION_THRESHOLD && rightKneeAngle < SQUAT_POSITION_THRESHOLD;
  }

  // Only one leg visible - check that one
  if (leftLegVisible) {
    const leftKneeAngle = getKneeAngle(leftHip, leftKnee, leftAnkle);
    return leftKneeAngle < SQUAT_POSITION_THRESHOLD;
  }

  const rightKneeAngle = getKneeAngle(rightHip, rightKnee, rightAnkle);
  return rightKneeAngle < SQUAT_POSITION_THRESHOLD;
}

/**
 * Check squat form and return alert if issues detected
 * Returns null if form is good or not in squat position
 */
export function checkSquatForm(landmarks: Landmark[]): SquatFormAlert | null {
  // First check if user is in squat position
  if (!isSquatPosition(landmarks)) {
    return null; // Don't alert when standing
  }

  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftKnee = landmarks[LEFT_KNEE];
  const rightKnee = landmarks[RIGHT_KNEE];
  const leftAnkle = landmarks[LEFT_ANKLE];
  const rightAnkle = landmarks[RIGHT_ANKLE];
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];

  // Check visibility for each check
  const leftLegVisible =
    isLandmarkVisible(leftHip) &&
    isLandmarkVisible(leftKnee) &&
    isLandmarkVisible(leftAnkle);
  const rightLegVisible =
    isLandmarkVisible(rightHip) &&
    isLandmarkVisible(rightKnee) &&
    isLandmarkVisible(rightAnkle);
  const torsoVisible =
    isLandmarkVisible(leftHip) &&
    isLandmarkVisible(rightHip) &&
    isLandmarkVisible(leftShoulder) &&
    isLandmarkVisible(rightShoulder);

  // Calculate knee angles
  let leftKneeAngle = 180;
  let rightKneeAngle = 180;

  if (leftLegVisible) {
    leftKneeAngle = getKneeAngle(leftHip, leftKnee, leftAnkle);
  }
  if (rightLegVisible) {
    rightKneeAngle = getKneeAngle(rightHip, rightKnee, rightAnkle);
  }

  // Check asymmetry first (if both legs visible)
  if (leftLegVisible && rightLegVisible) {
    const asymmetry = Math.abs(leftKneeAngle - rightKneeAngle);
    if (asymmetry > SQUAT_ASYMMETRIC_THRESHOLD) {
      return {
        type: 'squat-asymmetric',
        message: 'Uneven squat - balance your weight',
        severity: 'warning',
        affectedLandmarks: [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
      };
    }
  }

  // Check depth - knee angle should be below threshold for proper depth
  const avgKneeAngle = leftLegVisible && rightLegVisible
    ? (leftKneeAngle + rightKneeAngle) / 2
    : leftLegVisible ? leftKneeAngle : rightKneeAngle;

  if (avgKneeAngle > SQUAT_DEPTH_THRESHOLD) {
    return {
      type: 'squat-depth',
      message: 'Go deeper - break parallel',
      severity: 'warning',
      affectedLandmarks: [LEFT_HIP, LEFT_KNEE, RIGHT_HIP, RIGHT_KNEE],
    };
  }

  // Check knee cave - knees shouldn't move inward past ankle X position
  if (leftLegVisible && rightLegVisible) {
    // Left knee should be at or outside left ankle X
    const leftKneeCave = leftAnkle.x - leftKnee.x; // Positive means knee is inside ankle
    // Right knee should be at or outside right ankle X
    const rightKneeCave = rightKnee.x - rightAnkle.x; // Positive means knee is inside ankle

    if (leftKneeCave > SQUAT_KNEE_CAVE_THRESHOLD || rightKneeCave > SQUAT_KNEE_CAVE_THRESHOLD) {
      return {
        type: 'squat-knee-cave',
        message: 'Knees caving in - push knees out',
        severity: 'error',
        affectedLandmarks: [LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE],
      };
    }
  }

  // Check forward lean
  if (torsoVisible) {
    const torsoAngle = getTorsoAngle(landmarks);
    if (torsoAngle > SQUAT_FORWARD_LEAN_THRESHOLD) {
      return {
        type: 'squat-forward-lean',
        message: 'Leaning too far forward - chest up',
        severity: 'warning',
        affectedLandmarks: [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP],
      };
    }
  }

  // Form is good
  return null;
}
