import { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

export function CameraPreview() {
  const { stream, error, isLoading, videoRef, facingMode, toggleCamera } = useCamera();

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Requesting camera access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-3">📷</div>
          <p className="text-gray-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Video preview with camera switch button
  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
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

      {/* Camera switch button */}
      <button
        onClick={toggleCamera}
        className="absolute bottom-4 right-4 bg-gray-800/80 hover:bg-gray-700/90 text-white p-3 rounded-full transition-colors shadow-lg"
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
