import { useState, useCallback } from 'react';
import type { StoredRecording } from '../types/recording';
import type { UploadItem } from '../hooks/useCloudUpload';

// Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format date to readable format (e.g., "Jan 16, 2026 3:45 PM")
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format duration to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface RecordingListProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: StoredRecording[];
  onDelete: (id: number) => Promise<void>;
  storageStats: { count: number; totalSize: number };
  isLoading: boolean;
  // Cloud upload props
  cloudEnabled: boolean;
  uploads: UploadItem[];
  onUpload: (recording: StoredRecording) => void;
  onRetry: (id: number, recording: StoredRecording) => void;
  onConfigClick: () => void;
}

export function RecordingList({
  isOpen,
  onClose,
  recordings,
  onDelete,
  storageStats,
  isLoading,
  cloudEnabled,
  uploads,
  onUpload,
  onRetry,
  onConfigClick,
}: RecordingListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Get upload item for a recording
  const getUploadForRecording = useCallback(
    (recordingId: number): UploadItem | undefined => {
      return uploads.find((u) => u.id === recordingId);
    },
    [uploads]
  );

  // Handle delete with confirmation
  const handleDeleteClick = useCallback((id: number) => {
    setConfirmDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (confirmDeleteId === null) return;

    setDeletingId(confirmDeleteId);
    try {
      await onDelete(confirmDeleteId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  // Close modal when clicking overlay
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleOverlayClick}
    >
      {/* Modal content */}
      <div className="w-full max-w-md max-h-[80vh] bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Recordings</h2>
            <p className="text-xs text-gray-400">
              {storageStats.count} recording{storageStats.count !== 1 ? 's' : ''} &middot;{' '}
              {formatFileSize(storageStats.totalSize)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Cloud settings button */}
            <button
              onClick={onConfigClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={cloudEnabled ? 'Cloud upload enabled' : 'Configure cloud backup'}
            >
              {cloudEnabled ? (
                <>
                  {/* Green checkmark when enabled */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-green-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Cloud</span>
                </>
              ) : (
                <>
                  {/* Cloud icon when not enabled */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Cloud Settings</span>
                </>
              )}
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recordings.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-gray-500"
                >
                  <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No recordings yet</p>
              <p className="text-gray-500 text-xs mt-1">
                Record a video and save it to see it here
              </p>
            </div>
          ) : (
            // Recording list
            <ul className="divide-y divide-gray-700">
              {recordings.map((rec) => (
                <li key={rec.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail placeholder */}
                    <div className="w-16 h-12 rounded bg-gray-700 flex items-center justify-center shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-gray-500"
                      >
                        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {formatDate(rec.timestamp)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDuration(rec.duration)} &middot;{' '}
                        {formatFileSize(rec.fileSize)}
                      </p>
                    </div>

                    {/* Upload button / status */}
                    {(() => {
                      const upload = getUploadForRecording(rec.id);

                      // Cloud not enabled - show disabled upload button
                      if (!cloudEnabled) {
                        return (
                          <button
                            disabled
                            className="p-2 text-gray-500 cursor-not-allowed"
                            title="Enable cloud upload first"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.69a.75.75 0 001.5 0v-4.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        );
                      }

                      // Upload complete - show green checkmark
                      if (upload?.status === 'complete') {
                        return (
                          <span className="p-2 text-green-400" title="Uploaded">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        );
                      }

                      // Upload failed - show retry button
                      if (upload?.status === 'failed') {
                        return (
                          <button
                            onClick={() => onRetry(rec.id, rec)}
                            className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-gray-700 transition-colors"
                            title={upload.error || 'Upload failed - click to retry'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        );
                      }

                      // Uploading - show progress
                      if (upload?.status === 'pending' || upload?.status === 'uploading') {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-gray-400">
                              {upload.progress.percentage}%
                            </span>
                          </div>
                        );
                      }

                      // No upload yet - show upload button
                      return (
                        <button
                          onClick={() => onUpload(rec)}
                          className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-gray-700 transition-colors"
                          title="Upload to cloud"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.69a.75.75 0 001.5 0v-4.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      );
                    })()}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteClick(rec.id)}
                      disabled={deletingId === rec.id}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                      aria-label="Delete recording"
                    >
                      {deletingId === rec.id ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {confirmDeleteId !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full shadow-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Delete recording?
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
