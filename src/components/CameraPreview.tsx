import { useEffect, useState, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { usePostureAlerts } from '../hooks/usePostureAlerts';
import { useRecording } from '../hooks/useRecording';
import { PoseCanvas } from './PoseCanvas';
import { AlertOverlay } from './AlertOverlay';

// Format seconds to MM:SS display
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CameraPreview() {
  const { stream, error, isLoading, videoRef, facingMode, toggleCamera } = useCamera();
  const { landmarks, isDetecting } = usePoseDetection(videoRef, facingMode);
  const { currentAlert } = usePostureAlerts(landmarks);
  const { state: recordingState, duration, startRecording, stopRecording } = useRecording(stream);

  // Track video dimensions for canvas sizing
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when video metadata loads or resizes
  const updateDimensions = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      // Use the actual rendered size of the video element
      const rect = video.getBoundingClientRect();
      setVideoDimensions({ width: rect.width, height: rect.height });
    }
  }, [videoRef]);

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  // Listen for video metadata and resize events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Update on loadedmetadata
    video.addEventListener('loadedmetadata', updateDimensions);

    // Also update on resize (handles responsive layout changes)
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(video);

    // Initial update in case video is already loaded
    updateDimensions();

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      resizeObserver.disconnect();
    };
  }, [videoRef, updateDimensions]);

  // Loading state - responsive height
  if (isLoading) {
    return (
      <div className="relative w-full h-[70vh] md:h-auto md:aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Requesting camera access...</p>
        </div>
      </div>
    );
  }

  // Error state - responsive height
  if (error) {
    return (
      <div className="relative w-full h-[70vh] md:h-auto md:aspect-video bg-gray-700 rounded-lg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-3">📷</div>
          <p className="text-gray-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Video preview with skeleton overlay and camera switch button
  return (
    <div className="relative w-full h-[70vh] md:h-auto md:aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Pose skeleton overlay */}
      {videoDimensions.width > 0 && videoDimensions.height > 0 && (
        <PoseCanvas
          landmarks={landmarks}
          width={videoDimensions.width}
          height={videoDimensions.height}
        />
      )}

      {/* Alert overlay for bad posture */}
      <AlertOverlay alert={currentAlert} />

      {/* Detection status indicator */}
      <div className="absolute top-4 left-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isDetecting && landmarks
            ? 'bg-green-500/80 text-white'
            : 'bg-gray-800/80 text-gray-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isDetecting && landmarks ? 'bg-white animate-pulse' : 'bg-gray-500'
          }`} />
          {isDetecting && landmarks ? 'Tracking' : 'Initializing...'}
        </div>
      </div>

      {/* Recording indicator at top-right */}
      {recordingState === 'recording' && (
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
        onClick={recordingState === 'recording' ? stopRecording : startRecording}
        className={`absolute bottom-6 left-4 md:bottom-4 p-3 rounded-full transition-colors shadow-lg ${
          recordingState === 'recording'
            ? 'bg-red-600/90 hover:bg-red-500/90 active:bg-red-400/90'
            : 'bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90'
        } text-white`}
        style={{ minWidth: '48px', minHeight: '48px' }}
        aria-label={recordingState === 'recording' ? 'Stop recording' : 'Start recording'}
        title={recordingState === 'recording' ? 'Stop recording' : 'Start recording'}
      >
        {recordingState === 'idle' && (
          // White circle icon - ready to record
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>
        )}
        {recordingState === 'recording' && (
          // Red pulsing square with duration - stop recording
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-white animate-pulse" />
          </div>
        )}
        {recordingState === 'stopped' && (
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

      {/* Camera switch button - positioned for thumb reach on mobile */}
      <button
        onClick={toggleCamera}
        className="absolute bottom-6 right-4 md:bottom-4 bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90 text-white p-3 rounded-full transition-colors shadow-lg"
        style={{ minWidth: '48px', minHeight: '48px' }}
        aria-label="Switch camera"
        title="Switch camera"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M9 3h6l2 2h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1h4l2-2zm3 15a5 5 0 100-10 5 5 0 000 10zm0-2a3 3 0 110-6 3 3 0 010 6z" />
          <path d="M16.5 8.5l-2 2m0-2l2 2" strokeWidth="1.5" stroke="currentColor" fill="none" />
        </svg>
      </button>
    </div>
  );
}
