interface ContinuousRecordingStatusProps {
  state: 'idle' | 'recording' | 'paused' | 'uploading';
  error: string | null;
  uploadProgress?: { uploaded: number; total: number };
  hasRetries?: boolean;
}

export function ContinuousRecordingStatus({
  state,
  error,
  hasRetries,
}: ContinuousRecordingStatusProps) {
  // Error state - red
  if (error) {
    return (
      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
    );
  }

  // Recording state - green, pulsing
  if (state === 'recording') {
    return (
      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
    );
  }

  // Uploading state - yellow/orange, pulsing
  if (state === 'uploading') {
    const color = hasRetries ? 'bg-orange-500' : 'bg-yellow-500';
    const shadow = hasRetries
      ? 'shadow-[0_0_8px_rgba(249,115,22,0.8)]'
      : 'shadow-[0_0_8px_rgba(234,179,8,0.8)]';
    return (
      <div className={`w-3 h-3 rounded-full ${color} animate-pulse ${shadow}`} />
    );
  }

  // Paused/Idle state - grey, no pulse
  return (
    <div className="w-3 h-3 rounded-full bg-gray-500" />
  );
}
