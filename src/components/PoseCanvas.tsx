import { useEffect, useRef } from 'react';
import { Landmark, POSE_CONNECTIONS } from '../types/pose';

interface PoseCanvasProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
  highlightLandmarks?: number[]; // Landmark indices to highlight
  highlightSeverity?: 'warning' | 'error'; // Color to use
}

// Colors for skeleton drawing
const LANDMARK_COLOR = '#00FF00'; // Lime green for points
const CONNECTION_COLOR = '#00FFFF'; // Cyan for lines
const LANDMARK_RADIUS = 4;
const LINE_WIDTH = 2;

// Highlight colors for severity-based feedback
const HIGHLIGHT_WARNING_COLOR = '#FFCC00'; // Yellow for warnings
const HIGHLIGHT_ERROR_COLOR = '#FF3333'; // Red for errors
const HIGHLIGHT_RADIUS = 8; // Larger than normal landmarks
const HIGHLIGHT_LINE_WIDTH = 4; // Thicker connections
const HIGHLIGHT_GLOW_RADIUS = 12; // For glow effect

// Visibility threshold - only draw landmarks above this confidence
const VISIBILITY_THRESHOLD = 0.5;

export function PoseCanvas({ landmarks, width, height, highlightLandmarks, highlightSeverity }: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawTimestamp = useRef(0);
  const DRAW_THROTTLE = 33; // Limit canvas updates to ~30fps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const now = Date.now();
    if (now - lastDrawTimestamp.current < DRAW_THROTTLE) {
      return;
    }
    lastDrawTimestamp.current = now;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas each frame
    ctx.clearRect(0, 0, width, height);

    // Don't draw if no landmarks
    if (!landmarks || landmarks.length === 0) return;

    // Create set of highlighted landmark indices for quick lookup
    const highlightSet = new Set(highlightLandmarks ?? []);
    const hasHighlights = highlightSet.size > 0;
    const highlightColor = highlightSeverity === 'warning' ? HIGHLIGHT_WARNING_COLOR : HIGHLIGHT_ERROR_COLOR;

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

    // Draw highlighted landmarks and connections ON TOP of normal skeleton
    if (hasHighlights) {
      // First, draw highlighted connections with thicker lines
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = HIGHLIGHT_LINE_WIDTH;
      ctx.lineCap = 'round';

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        // Only draw if at least one endpoint is highlighted
        if (!highlightSet.has(startIdx) && !highlightSet.has(endIdx)) continue;

        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

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

      // Draw glow effect behind highlighted landmarks
      for (let i = 0; i < landmarks.length; i++) {
        if (!highlightSet.has(i)) continue;
        const landmark = landmarks[i];
        if (landmark.visibility <= VISIBILITY_THRESHOLD) continue;

        const x = landmark.x * width;
        const y = landmark.y * height;

        // Draw semi-transparent glow
        ctx.beginPath();
        ctx.arc(x, y, HIGHLIGHT_GLOW_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = highlightColor + '40'; // 25% opacity
        ctx.fill();
      }

      // Draw highlighted landmarks with larger radius
      ctx.fillStyle = highlightColor;

      for (let i = 0; i < landmarks.length; i++) {
        if (!highlightSet.has(i)) continue;
        const landmark = landmarks[i];
        if (landmark.visibility <= VISIBILITY_THRESHOLD) continue;

        ctx.beginPath();
        ctx.arc(
          landmark.x * width,
          landmark.y * height,
          HIGHLIGHT_RADIUS,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }
  }, [landmarks, width, height, highlightLandmarks, highlightSeverity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
}
