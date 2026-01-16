import type { RecordingState, Recording } from '../types/recording';

// Format seconds to MM:SS display
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface RecordingControlsProps {
  state: RecordingState;
  recording: Recording | null;
  duration: number;
  onStart: () => void;
  onStop: () => void;
}

export function RecordingControls({
  state,
  recording: _recording,
  duration,
  onStart,
  onStop,
}: RecordingControlsProps) {
  // _recording will be used in Task 2 for download functionality
  return (
    <>
      {/* Recording indicator at top-right */}
      {state === 'recording' && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-600/90 text-white">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>REC</span>
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
        </div>
      )}

      {/* Recording control button - bottom-left (opposite of camera switch) */}
      <button
        onClick={state === 'recording' ? onStop : onStart}
        className={`absolute bottom-6 left-4 md:bottom-4 p-3 rounded-full transition-colors shadow-lg ${
          state === 'recording'
            ? 'bg-red-600/90 hover:bg-red-500/90 active:bg-red-400/90'
            : 'bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90'
        } text-white`}
        style={{ minWidth: '48px', minHeight: '48px' }}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
        title={state === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {state === 'idle' && (
          // White circle icon - ready to record
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>
        )}
        {state === 'recording' && (
          // Red pulsing square with duration - stop recording
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-white animate-pulse" />
          </div>
        )}
        {state === 'stopped' && (
          // Checkmark icon - recording complete
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </>
  );
}
