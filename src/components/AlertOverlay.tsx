import { ExerciseAlert } from '../hooks/useExerciseAlerts';

interface AlertOverlayProps {
  alert: ExerciseAlert | null;
}

/**
 * Visual overlay for posture alerts
 * Displays color-coded border and message based on alert severity
 * - Warning (yellow): For form issues that should be corrected
 * - Error (red): For critical form problems that could cause injury
 */
export function AlertOverlay({ alert }: AlertOverlayProps) {
  if (!alert) {
    return null;
  }

  // Severity-based styling
  const isError = alert.severity === 'error';
  const borderColor = isError ? 'border-red-500' : 'border-yellow-400';
  const bannerBg = isError ? 'bg-red-600/90' : 'bg-yellow-500/90';
  const textColor = isError ? 'text-white' : 'text-gray-900';

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Animated border for warning indicator - color based on severity */}
      <div className={`absolute inset-0 border-4 ${borderColor} animate-pulse rounded-lg`} />

      {/* Alert message - positioned at top center, avoiding left/right control panels */}
      {/* On mobile: left-20 avoids left panel (tracking status, skeleton toggle, continuous recording) */}
      {/* On mobile: right-20 avoids right panel (exercise mode selector, lock button area) */}
      <div className="absolute top-4 left-20 right-20 md:left-1/4 md:right-1/4 flex justify-center">
        <div className={`${bannerBg} ${textColor} px-3 py-2 rounded-lg shadow-lg max-w-full`}>
          <p className="text-xs sm:text-sm md:text-base font-medium text-center leading-tight">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}
