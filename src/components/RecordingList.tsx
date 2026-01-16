import { useState, useCallback } from 'react';
import type { StoredRecording } from '../types/recording';

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
}

export function RecordingList({
  isOpen,
  onClose,
  recordings,
  onDelete,
  storageStats,
  isLoading,
}: RecordingListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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
