import { useCallback } from 'react';
import type { RecordingState, Recording } from '../types/recording';

// Format seconds to MM:SS display
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format timestamp for filename: YYYY-MM-DD-HHmmss
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
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
  recording,
  duration,
  onStart,
  onStop,
}: RecordingControlsProps) {
  // Download the recorded video
  const handleDownload = useCallback(() => {
    if (!recording) return;

    // Create anchor element to trigger download
    const anchor = document.createElement('a');
    anchor.href = recording.url;
    anchor.download = `formcheck-${formatTimestamp(recording.timestamp)}.webm`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [recording]);

  // Start new recording (clears current recording)
  const handleNewRecording = useCallback(() => {
    onStart();
  }, [onStart]);

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

      {/* Button container - horizontal row at bottom-left */}
      <div className="absolute bottom-6 left-4 md:bottom-4 flex items-center gap-2">
        {/* Record/Stop button */}
        <button
          onClick={state === 'recording' ? onStop : (state === 'stopped' ? handleNewRecording : onStart)}
          className={`p-3 rounded-full transition-colors shadow-lg ${
            state === 'recording'
              ? 'bg-red-600/90 hover:bg-red-500/90 active:bg-red-400/90'
              : 'bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90'
          } text-white`}
          style={{ minWidth: '48px', minHeight: '48px' }}
          aria-label={
            state === 'recording'
              ? 'Stop recording'
              : state === 'stopped'
                ? 'New recording'
                : 'Start recording'
          }
          title={
            state === 'recording'
              ? 'Stop recording'
              : state === 'stopped'
                ? 'New recording'
                : 'Start recording'
          }
        >
          {state === 'idle' && (
            // White circle icon - ready to record
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          )}
          {state === 'recording' && (
            // White square icon - stop recording
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-white animate-pulse" />
            </div>
          )}
          {state === 'stopped' && (
            // Circle with plus icon - new recording
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3 text-gray-800"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* Download button - appears when recording is available */}
        {state === 'stopped' && recording && (
          <button
            onClick={handleDownload}
            className="p-3 rounded-full transition-colors shadow-lg bg-blue-600/90 hover:bg-blue-500/90 active:bg-blue-400/90 text-white"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label="Download recording"
            title="Download recording"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
