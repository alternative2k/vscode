import { useEffect, useState, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useExerciseAlerts, ExerciseMode } from '../hooks/useExerciseAlerts';
import { useRecording } from '../hooks/useRecording';
import { useRecordingHistory } from '../hooks/useRecordingHistory';
import { useS3Upload } from '../hooks/useS3Upload';
import { PoseCanvas } from './PoseCanvas';
import { AlertOverlay } from './AlertOverlay';
import { RecordingControls } from './RecordingControls';
import { RecordingList } from './RecordingList';
import { S3ConfigModal } from './S3ConfigModal';

export function CameraPreview() {
  const { stream, error, isLoading, videoRef, facingMode, toggleCamera } = useCamera();
  const { landmarks, isDetecting } = usePoseDetection(videoRef, facingMode);

  // Exercise mode state
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('general');
  const { currentAlert, isExercising } = useExerciseAlerts(landmarks, exerciseMode);
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

  // S3 upload
  const {
    config: s3Config,
    saveConfig: saveS3Config,
    clearConfig: clearS3Config,
    uploads,
    uploadRecording,
    retryUpload,
  } = useS3Upload();
  const [showS3Config, setShowS3Config] = useState(false);

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

  // Open/close recording list modal
  const handleShowHistory = useCallback(() => {
    setShowRecordingList(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowRecordingList(false);
  }, []);

  // S3 config modal handlers
  const handleOpenS3Config = useCallback(() => {
    setShowS3Config(true);
  }, []);

  const handleCloseS3Config = useCallback(() => {
    setShowS3Config(false);
  }, []);

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

      {/* Exercise mode selector */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
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
        onStart={startRecording}
        onStop={stopRecording}
        onSave={handleSaveRecording}
        onShowHistory={handleShowHistory}
        recordingCount={storageStats.count}
        isSaving={isSaving}
      />

      {/* Recording list modal */}
      <RecordingList
        isOpen={showRecordingList}
        onClose={handleCloseHistory}
        recordings={recordings}
        onDelete={deleteRecording}
        storageStats={storageStats}
        isLoading={isHistoryLoading}
        s3Config={s3Config}
        uploads={uploads}
        onUpload={uploadRecording}
        onRetry={retryUpload}
        onConfigClick={handleOpenS3Config}
      />

      {/* S3 configuration modal */}
      <S3ConfigModal
        isOpen={showS3Config}
        onClose={handleCloseS3Config}
        config={s3Config}
        onSave={saveS3Config}
        onClear={clearS3Config}
      />

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
