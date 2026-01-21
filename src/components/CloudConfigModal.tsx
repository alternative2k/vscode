import { useCallback } from 'react';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
}

export function CloudConfigModal({
  isOpen,
  onClose,
  isEnabled,
  onEnable,
  onDisable,
}: CloudConfigModalProps) {
  // Close modal when clicking overlay
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEnable = useCallback(() => {
    onEnable();
    onClose();
  }, [onEnable, onClose]);

  const handleDisable = useCallback(() => {
    onDisable();
    onClose();
  }, [onDisable, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Cloud Upload Settings</h2>
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
        <div className="p-4 space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Status:</span>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-600/50 text-gray-400 border border-gray-500/30">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                Disabled
              </span>
            )}
          </div>

          {/* Explanatory text */}
          <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-sm text-blue-200">
              Recordings are securely uploaded to cloud storage using presigned URLs.
              Your credentials are never stored in the browser.
            </p>
          </div>

          {isEnabled && (
            <p className="text-sm text-gray-400">
              Upload buttons will appear next to your recordings. Click to upload individual recordings to the cloud.
            </p>
          )}

          {!isEnabled && (
            <p className="text-sm text-gray-400">
              Enable cloud upload to back up your recordings. Requires server configuration.
            </p>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {isEnabled ? (
            <button
              onClick={handleDisable}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Disable Cloud Upload
            </button>
          ) : (
            <button
              onClick={handleEnable}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Enable Cloud Upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
