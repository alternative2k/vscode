import { useEffect, useState, useCallback, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseAlerts, ExerciseMode } from '../hooks/useExerciseAlerts';
import { useRecording } from '../hooks/useRecording';
import { useRecordingHistory } from '../hooks/useRecordingHistory';
import { useCloudUpload } from '../hooks/useCloudUpload';
import { useContinuousRecording } from '../hooks/useContinuousRecording';
import { useFullscreen } from '../hooks/useFullscreen';
import { useAuth } from '../hooks/useAuth';
import { uploadToCloud } from '../utils/cloudUpload';
import { PoseCanvas } from './PoseCanvas';
import { AlertOverlay } from './AlertOverlay';
import { RecordingControls } from './RecordingControls';
import { RecordingList } from './RecordingList';
import { CloudConfigModal } from './CloudConfigModal';
import { ContinuousRecordingStatus } from './ContinuousRecordingStatus';

// Detect if running on a mobile device
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get current orientation type
function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  // Use screen.orientation.type if available (most modern browsers)
  if (window.screen?.orientation?.type) {
    return window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
  }
  // Fallback to window dimensions
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

export function CameraPreview() {
  const { stream, error, isLoading, videoRef, facingMode, toggleCamera } = useCamera();
  const { landmarks, isDetecting } = usePoseDetection(videoRef, facingMode);
  const { isFullscreen, toggleFullscreen, isSupported: fullscreenSupported } = useFullscreen();
  const { user } = useAuth();

  // Orientation tracking
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(getOrientation);
  const [showRotationHint, setShowRotationHint] = useState(false);
  const hasShownRotationHintRef = useRef(false);
  const isMobile = useRef(isMobileDevice()).current;

  // Track orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    // Use screen.orientation API if available
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    // Fallback to resize event
    window.addEventListener('resize', handleOrientationChange);
    // Legacy orientationchange event
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Show rotation hint when entering fullscreen in portrait on mobile
  useEffect(() => {
    if (isFullscreen && orientation === 'portrait' && isMobile && !hasShownRotationHintRef.current) {
      hasShownRotationHintRef.current = true;
      setShowRotationHint(true);
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShowRotationHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Reset hint flag when exiting fullscreen
    if (!isFullscreen) {
      hasShownRotationHintRef.current = false;
    }
  }, [isFullscreen, orientation, isMobile]);

  // Exercise mode state
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('general');

  // Skeleton overlay visibility state
  const [showSkeleton, setShowSkeleton] = useState(true);
  const { currentAlert, affectedLandmarks, isExercising } = useExerciseAlerts(landmarks, exerciseMode);
  const { state: recordingState, recording, duration, startRecording, stopRecording } = useRecording(stream);

  // Recording history
  const {
    recordings,
    isLoading: isHistoryLoading,
    saveRecording,
    deleteRecording,
    storageStats,
  } = useRecordingHistory();
  const [showRecordingList, setShowRecordingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

  // Cloud upload
  const {
    isConfigured: cloudEnabled,
    enableCloud,
    disableCloud,
    uploads,
    uploadRecording,
    retryUpload,
  } = useCloudUpload();
  const [showCloudConfig, setShowCloudConfig] = useState(false);

  // Continuous recording - auto-starts when stream is available
  const {
    state: continuousState,
    error: continuousError,
    uploadProgress,
    hasRetries: continuousHasRetries,
  } = useContinuousRecording(stream, { autoStart: true, userId: user?.id });

  // Handle save recording to IndexedDB
  const handleSaveRecording = useCallback(async () => {
    if (!recording) return;
    setIsSaving(true);
    try {
      await saveRecording(recording);
    } finally {
      setIsSaving(false);
    }
  }, [recording, saveRecording]);

  // Manual upload state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Wrapper to reset upload state when starting new recording
  const handleStartRecording = useCallback(() => {
    setUploadError(null);
    setUploadSuccess(false);
    startRecording();
  }, [startRecording]);

  // Handle direct upload of manual recording to cloud
  const handleUploadRecording = useCallback(async () => {
    if (!recording || !cloudEnabled) return;
    setIsUploadingManual(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      // Generate filename for the upload
      const timestamp = recording.timestamp.getTime();
      const fileName = `manual/formcheck-${timestamp}.webm`;
      const result = await uploadToCloud(recording.blob, fileName);
      if (result.success) {
        setUploadSuccess(true);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploadingManual(false);
    }
  }, [recording, cloudEnabled]);

  // Open/close recording list modal
  const handleShowHistory = useCallback(() => {
    setShowRecordingList(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowRecordingList(false);
  }, []);

  // Cloud config modal handlers
  const handleOpenCloudConfig = useCallback(() => {
    setShowCloudConfig(true);
  }, []);

  const handleCloseCloudConfig = useCallback(() => {
    setShowCloudConfig(false);
  }, []);

  // Track video dimensions for canvas sizing
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when video metadata loads or resizes
  const updateDimensions = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      // Use the actual rendered size of the video element
      const rect = video.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setVideoDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, [videoRef]);

  // Fallback: poll for dimensions when stream is available but dimensions are zero
  useEffect(() => {
    if (!stream || videoDimensions.width > 0) return;

    const interval = setInterval(() => {
      updateDimensions();
    }, 100);

    // Stop polling after 5 seconds
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [stream, videoDimensions.width, updateDimensions]);

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
    // Also listen for 'playing' event in case metadata already fired
    video.addEventListener('playing', updateDimensions);

    // Also update on resize (handles responsive layout changes)
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(video);

    // Initial update in case video is already loaded
    updateDimensions();

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      video.removeEventListener('playing', updateDimensions);
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
      {showSkeleton && videoDimensions.width > 0 && videoDimensions.height > 0 && (
        <PoseCanvas
          landmarks={landmarks}
          width={videoDimensions.width}
          height={videoDimensions.height}
          highlightLandmarks={affectedLandmarks}
          highlightSeverity={currentAlert?.severity}
        />
      )}

      {/* Alert overlay for bad posture */}
      <AlertOverlay alert={currentAlert} />

      {/* Rotation hint toast - shows when entering fullscreen in portrait on mobile */}
      {showRotationHint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-blue-400"
            >
              <path d="M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z" />
              <path d="M12 18h.01" />
            </svg>
            <span className="text-sm font-medium">Rotate device for best view</span>
          </div>
        </div>
      )}

      {/* Detection status indicator and skeleton toggle */}
      {/* In fullscreen landscape: show minimal indicator only, hide toggle buttons to maximize video */}
      <div className={`absolute top-4 left-4 flex flex-col gap-2 transition-opacity ${
        isFullscreen && orientation === 'landscape' ? 'opacity-60 hover:opacity-100' : ''
      }`}>
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

        {/* Skeleton overlay toggle button */}
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            showSkeleton
              ? 'bg-cyan-500/80 text-white hover:bg-cyan-600/80'
              : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
          }`}
          title={showSkeleton ? 'Hide skeleton overlay' : 'Show skeleton overlay'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            {/* Skeleton icon - simplified stick figure */}
            <circle cx="12" cy="4" r="2" />
            <line x1="12" y1="6" x2="12" y2="14" />
            <line x1="8" y1="9" x2="16" y2="9" />
            <line x1="12" y1="14" x2="8" y2="20" />
            <line x1="12" y1="14" x2="16" y2="20" />
          </svg>
          {showSkeleton ? 'Skeleton On' : 'Skeleton Off'}
        </button>

        {/* Continuous recording status indicator */}
        <ContinuousRecordingStatus
          state={continuousState}
          error={continuousError}
          uploadProgress={uploadProgress}
          hasRetries={continuousHasRetries}
        />
      </div>

      {/* Exercise mode selector */}
      {/* In fullscreen landscape: reduce opacity to minimize distraction, show on hover */}
      <div className={`absolute top-4 right-4 flex flex-col gap-2 items-end transition-opacity ${
        isFullscreen && orientation === 'landscape' ? 'opacity-60 hover:opacity-100' : ''
      }`}>
        <div className="flex gap-1 bg-gray-800/80 rounded-full p-1">
          <button
            onClick={() => setExerciseMode('general')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              exerciseMode === 'general'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setExerciseMode('squat')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              exerciseMode === 'squat'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Squat
          </button>
          <button
            onClick={() => setExerciseMode('pushup')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              exerciseMode === 'pushup'
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Push-up
          </button>
        </div>

        {/* Exercise detected indicator */}
        {exerciseMode === 'squat' && isExercising && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/80 text-white">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Squat detected
          </div>
        )}
        {exerciseMode === 'pushup' && isExercising && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/80 text-white">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Push-up detected
          </div>
        )}

        {/* Camera positioning hint for push-up mode */}
        {exerciseMode === 'pushup' && !isExercising && (
          <div className="text-xs text-gray-400 text-right max-w-[140px]">
            Best results from side view
          </div>
        )}
      </div>

      {/* Recording controls - indicator and buttons */}
      <RecordingControls
        state={recordingState}
        recording={recording}
        duration={duration}
        onStart={handleStartRecording}
        onStop={stopRecording}
        onSave={handleSaveRecording}
        onShowHistory={handleShowHistory}
        recordingCount={storageStats.count}
        isSaving={isSaving}
        onUpload={handleUploadRecording}
        isUploading={isUploadingManual}
        cloudEnabled={cloudEnabled}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
      />

      {/* Recording list modal */}
      <RecordingList
        isOpen={showRecordingList}
        onClose={handleCloseHistory}
        recordings={recordings}
        onDelete={deleteRecording}
        storageStats={storageStats}
        isLoading={isHistoryLoading}
        cloudEnabled={cloudEnabled}
        uploads={uploads}
        onUpload={uploadRecording}
        onRetry={retryUpload}
        onConfigClick={handleOpenCloudConfig}
      />

      {/* Cloud configuration modal */}
      <CloudConfigModal
        isOpen={showCloudConfig}
        onClose={handleCloseCloudConfig}
        isEnabled={cloudEnabled}
        onEnable={enableCloud}
        onDisable={disableCloud}
      />

      {/* Bottom-right control buttons container */}
      <div className="absolute bottom-6 right-4 md:bottom-4 flex flex-col gap-3">
        {/* Fullscreen toggle button - only show if supported */}
        {fullscreenSupported && (
          <button
            onClick={toggleFullscreen}
            className="bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90 text-white p-3 rounded-full transition-colors shadow-lg"
            style={{ minWidth: '48px', minHeight: '48px' }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              // Compress icon (exit fullscreen)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M8 3v3a2 2 0 01-2 2H3" />
                <path d="M21 8h-3a2 2 0 01-2-2V3" />
                <path d="M3 16h3a2 2 0 012 2v3" />
                <path d="M16 21v-3a2 2 0 012-2h3" />
              </svg>
            ) : (
              // Expand icon (enter fullscreen)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M8 3H5a2 2 0 00-2 2v3" />
                <path d="M21 8V5a2 2 0 00-2-2h-3" />
                <path d="M3 16v3a2 2 0 002 2h3" />
                <path d="M16 21h3a2 2 0 002-2v-3" />
              </svg>
            )}
          </button>
        )}

        {/* Camera switch button */}
        <button
          onClick={toggleCamera}
          className="bg-gray-800/80 hover:bg-gray-700/90 active:bg-gray-600/90 text-white p-3 rounded-full transition-colors shadow-lg"
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
    </div>
  );
}
