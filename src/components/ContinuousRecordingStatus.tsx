interface ContinuousRecordingStatusProps {
  state: 'idle' | 'recording' | 'paused' | 'uploading';
  error: string | null;
  uploadProgress?: { uploaded: number; total: number };
  hasRetries?: boolean;
}

export function ContinuousRecordingStatus({
  state,
  error,
  uploadProgress,
  hasRetries,
}: ContinuousRecordingStatusProps) {
  // Error state takes precedence
  if (error) {
    const truncatedError = error.length > 20 ? error.slice(0, 17) + '...' : error;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/80 text-white">
        <div className="w-2 h-2 rounded-full bg-white" />
        {truncatedError}
      </div>
    );
  }

  // Recording state - green, pulsing
  if (state === 'recording') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/80 text-white">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        Recording
      </div>
    );
  }

  // Uploading state - yellow/orange, pulsing with progress
  if (state === 'uploading') {
    const action = hasRetries ? 'Retrying' : 'Uploading';
    const progressText = uploadProgress
      ? `${action} ${uploadProgress.uploaded}/${uploadProgress.total}`
      : action;
    // Use orange for retries, yellow for regular uploads
    const bgColor = hasRetries ? 'bg-orange-500/80' : 'bg-yellow-500/80';
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} text-white`}>
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        {progressText}
      </div>
    );
  }

  // Paused state - grey, no pulse
  if (state === 'paused') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/80 text-gray-300">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        Paused
      </div>
    );
  }

  // Idle state - grey, no pulse, "Standby"
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/80 text-gray-300">
      <div className="w-2 h-2 rounded-full bg-gray-500" />
      Standby
    </div>
  );
}
