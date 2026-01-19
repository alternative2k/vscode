import { useEffect, useRef } from 'react';
import { Landmark, POSE_CONNECTIONS } from '../types/pose';

interface PoseCanvasProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
}

// Colors for skeleton drawing
const LANDMARK_COLOR = '#00FF00'; // Lime green for points
const CONNECTION_COLOR = '#00FFFF'; // Cyan for lines
const LANDMARK_RADIUS = 4;
const LINE_WIDTH = 2;

// Visibility threshold - only draw landmarks above this confidence
const VISIBILITY_THRESHOLD = 0.5;

export function PoseCanvas({ landmarks, width, height }: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas each frame
    ctx.clearRect(0, 0, width, height);

    // Don't draw if no landmarks
    if (!landmarks || landmarks.length === 0) return;

    // Draw connections (lines between landmarks)
    ctx.strokeStyle = CONNECTION_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      // Only draw if both landmarks are visible enough
      if (
        start &&
        end &&
        start.visibility > VISIBILITY_THRESHOLD &&
        end.visibility > VISIBILITY_THRESHOLD
      ) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    }

    // Draw landmarks (circles at each point)
    ctx.fillStyle = LANDMARK_COLOR;

    for (const landmark of landmarks) {
      // Only draw visible landmarks
      if (landmark.visibility > VISIBILITY_THRESHOLD) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * width,
          landmark.y * height,
          LANDMARK_RADIUS,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }
  }, [landmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
}
