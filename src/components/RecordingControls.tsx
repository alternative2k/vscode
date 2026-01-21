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
  onSave?: () => void;
  onShowHistory?: () => void;
  recordingCount?: number;
  isSaving?: boolean;
  // Cloud upload props
  onUpload?: () => void;
  isUploading?: boolean;
  cloudEnabled?: boolean;
}

export function RecordingControls({
  state,
  recording,
  duration,
  onStart,
  onStop,
  onSave,
  onShowHistory,
  recordingCount = 0,
  isSaving = false,
  onUpload,
  isUploading = false,
  cloudEnabled = false,
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
      {/* Recording indicator at top-center */}
      {state === 'recording' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-600/90 text-white shadow-lg">
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

        {/* Upload button - appears when recording is available and cloud is configured */}
        {state === 'stopped' && recording && cloudEnabled && onUpload && (
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="p-3 rounded-full transition-colors shadow-lg bg-violet-600/90 hover:bg-violet-500/90 active:bg-violet-400/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label="Upload to cloud"
            title="Upload to cloud"
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                {/* Cloud with up arrow icon */}
                <path
                  fillRule="evenodd"
                  d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.19a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}

        {/* Save button - appears when recording is available */}
        {state === 'stopped' && recording && onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="p-3 rounded-full transition-colors shadow-lg bg-green-600/90 hover:bg-green-500/90 active:bg-green-400/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label="Save recording"
            title="Save recording"
          >
            {isSaving ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M5.478 5.559A1.5 1.5 0 016.912 4.5H9A.75.75 0 009 3H6.912a3 3 0 00-2.868 2.118l-2.411 7.838a3 3 0 00-.133.882V18a3 3 0 003 3h15a3 3 0 003-3v-4.162c0-.299-.045-.596-.133-.882l-2.412-7.838A3 3 0 0017.088 3H15a.75.75 0 000 1.5h2.088a1.5 1.5 0 011.434 1.059l2.213 7.191H17.89a3 3 0 00-2.684 1.658l-.256.513a1.5 1.5 0 01-1.342.829h-3.218a1.5 1.5 0 01-1.342-.83l-.256-.512a3 3 0 00-2.684-1.658H3.265l2.213-7.191z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M12 2.25a.75.75 0 01.75.75v6.44l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 011.06-1.06l1.72 1.72V3a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}

        {/* History button - always visible when callback provided */}
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            className="p-3 rounded-full transition-colors shadow-lg bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90 text-white relative"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label="View recording history"
            title="View recording history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
            </svg>
            {/* Badge showing recording count */}
            {recordingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-blue-500 text-white text-xs font-bold rounded-full px-1.5">
                {recordingCount > 99 ? '99+' : recordingCount}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
