import { memo } from 'react';
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
export const AlertOverlay = memo(function AlertOverlay({ alert }: AlertOverlayProps) {
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

      {/* Alert message - positioned below control panels to avoid overlap */}
      {/* top-28 on mobile clears the left panel (tracking, skeleton, continuous status ~100px tall) */}
      {/* top-16 on desktop where panels are more compact */}
      <div className="absolute top-28 md:top-16 left-4 right-4 md:left-1/4 md:right-1/4 flex justify-center">
        <div className={`${bannerBg} ${textColor} px-3 py-2 rounded-lg shadow-lg max-w-full`}>
          <p className="text-xs sm:text-sm md:text-base font-medium text-center leading-tight">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Optimization: Only re-render if the alert content actually changes
  // This prevents re-renders when parent updates but alert is stable
  if (prev.alert === next.alert) return true;
  if (!prev.alert || !next.alert) return false;
  return prev.alert.message === next.alert.message && prev.alert.severity === next.alert.severity;
});
