/**
 * MediaPipe Pose types and landmark constants
 * Reference: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResults {
  poseLandmarks: Landmark[] | null;
}

// MediaPipe Pose has 33 landmarks (0-32)
// Key landmark indices for form analysis

// Face
export const NOSE = 0;
export const LEFT_EYE_INNER = 1;
export const LEFT_EYE = 2;
export const LEFT_EYE_OUTER = 3;
export const RIGHT_EYE_INNER = 4;
export const RIGHT_EYE = 5;
export const RIGHT_EYE_OUTER = 6;
export const LEFT_EAR = 7;
export const RIGHT_EAR = 8;
export const MOUTH_LEFT = 9;
export const MOUTH_RIGHT = 10;

// Upper body
export const LEFT_SHOULDER = 11;
export const RIGHT_SHOULDER = 12;
export const LEFT_ELBOW = 13;
export const RIGHT_ELBOW = 14;
export const LEFT_WRIST = 15;
export const RIGHT_WRIST = 16;
export const LEFT_PINKY = 17;
export const RIGHT_PINKY = 18;
export const LEFT_INDEX = 19;
export const RIGHT_INDEX = 20;
export const LEFT_THUMB = 21;
export const RIGHT_THUMB = 22;

// Lower body
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;
export const LEFT_HEEL = 29;
export const RIGHT_HEEL = 30;
export const LEFT_FOOT_INDEX = 31;
export const RIGHT_FOOT_INDEX = 32;

// Skeleton connections for drawing
// Each pair represents a line to draw between landmarks
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [NOSE, LEFT_EYE_INNER],
  [LEFT_EYE_INNER, LEFT_EYE],
  [LEFT_EYE, LEFT_EYE_OUTER],
  [LEFT_EYE_OUTER, LEFT_EAR],
  [NOSE, RIGHT_EYE_INNER],
  [RIGHT_EYE_INNER, RIGHT_EYE],
  [RIGHT_EYE, RIGHT_EYE_OUTER],
  [RIGHT_EYE_OUTER, RIGHT_EAR],
  [MOUTH_LEFT, MOUTH_RIGHT],

  // Torso
  [LEFT_SHOULDER, RIGHT_SHOULDER],
  [LEFT_SHOULDER, LEFT_HIP],
  [RIGHT_SHOULDER, RIGHT_HIP],
  [LEFT_HIP, RIGHT_HIP],

  // Left arm
  [LEFT_SHOULDER, LEFT_ELBOW],
  [LEFT_ELBOW, LEFT_WRIST],
  [LEFT_WRIST, LEFT_PINKY],
  [LEFT_WRIST, LEFT_INDEX],
  [LEFT_WRIST, LEFT_THUMB],
  [LEFT_PINKY, LEFT_INDEX],

  // Right arm
  [RIGHT_SHOULDER, RIGHT_ELBOW],
  [RIGHT_ELBOW, RIGHT_WRIST],
  [RIGHT_WRIST, RIGHT_PINKY],
  [RIGHT_WRIST, RIGHT_INDEX],
  [RIGHT_WRIST, RIGHT_THUMB],
  [RIGHT_PINKY, RIGHT_INDEX],

  // Left leg
  [LEFT_HIP, LEFT_KNEE],
  [LEFT_KNEE, LEFT_ANKLE],
  [LEFT_ANKLE, LEFT_HEEL],
  [LEFT_ANKLE, LEFT_FOOT_INDEX],
  [LEFT_HEEL, LEFT_FOOT_INDEX],

  // Right leg
  [RIGHT_HIP, RIGHT_KNEE],
  [RIGHT_KNEE, RIGHT_ANKLE],
  [RIGHT_ANKLE, RIGHT_HEEL],
  [RIGHT_ANKLE, RIGHT_FOOT_INDEX],
  [RIGHT_HEEL, RIGHT_FOOT_INDEX],
];
