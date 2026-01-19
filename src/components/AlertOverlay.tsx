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
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Animated red border for warning indicator */}
      <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg" />

      {/* Alert message - positioned below controls on mobile, centered at top on larger screens */}
      <div className="absolute top-14 left-4 right-4 sm:top-4 sm:left-0 sm:right-0 flex justify-center">
        <div className="bg-red-600/90 text-white px-3 py-2 rounded-lg shadow-lg max-w-[90%] sm:max-w-md">
          <p className="text-xs sm:text-sm md:text-base font-medium text-center leading-tight">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}
