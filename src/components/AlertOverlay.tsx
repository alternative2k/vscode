import { ExerciseAlert } from '../hooks/useExerciseAlerts';

interface AlertOverlayProps {
  alert: ExerciseAlert | null;
}

/**
 * Visual overlay for posture alerts
 * Displays red border and message when bad posture detected
 */
export function AlertOverlay({ alert }: AlertOverlayProps) {
  if (!alert) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Animated red border for warning indicator */}
      <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg" />

      {/* Alert message at top */}
      <div className="absolute top-0 left-0 right-0 flex justify-center p-4">
        <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm md:text-base font-medium text-center">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}
