import { useState, useCallback, useEffect } from 'react';
import type { S3Config } from '../types/s3';

interface S3ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: S3Config | null;
  onSave: (config: S3Config) => void;
  onClear: () => void;
}

export function S3ConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  onClear,
}: S3ConfigModalProps) {
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from config when opening
  useEffect(() => {
    if (isOpen && config) {
      setBucket(config.bucket);
      setRegion(config.region);
      setAccessKeyId(config.accessKeyId);
      setSecretAccessKey(config.secretAccessKey);
    } else if (isOpen && !config) {
      // Reset form when opening without config
      setBucket('');
      setRegion('');
      setAccessKeyId('');
      setSecretAccessKey('');
    }
    setErrors({});
  }, [isOpen, config]);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!bucket.trim()) {
      newErrors.bucket = 'Bucket name is required';
    }
    if (!region.trim()) {
      newErrors.region = 'Region is required';
    }
    if (!accessKeyId.trim()) {
      newErrors.accessKeyId = 'Access Key ID is required';
    }
    if (!secretAccessKey.trim()) {
      newErrors.secretAccessKey = 'Secret Access Key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bucket, region, accessKeyId, secretAccessKey]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return;

    onSave({
      bucket: bucket.trim(),
      region: region.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    });
    onClose();
  }, [bucket, region, accessKeyId, secretAccessKey, onSave, onClose, validate]);

  // Handle clear
  const handleClear = useCallback(() => {
    onClear();
    onClose();
  }, [onClear, onClose]);

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
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">S3 Configuration</h2>
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

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Security warning */}
          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <p className="text-xs text-yellow-200">
              <strong>Note:</strong> Credentials are stored in your browser's localStorage.
              Only use this on trusted devices.
            </p>
          </div>

          {/* Bucket Name */}
          <div>
            <label
              htmlFor="bucket"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Bucket Name
            </label>
            <input
              id="bucket"
              type="text"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-formcheck-bucket"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.bucket ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.bucket && (
              <p className="mt-1 text-xs text-red-400">{errors.bucket}</p>
            )}
          </div>

          {/* Region */}
          <div>
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Region
            </label>
            <input
              id="region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.region ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.region && (
              <p className="mt-1 text-xs text-red-400">{errors.region}</p>
            )}
          </div>

          {/* Access Key ID */}
          <div>
            <label
              htmlFor="accessKeyId"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Access Key ID
            </label>
            <input
              id="accessKeyId"
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.accessKeyId ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.accessKeyId && (
              <p className="mt-1 text-xs text-red-400">{errors.accessKeyId}</p>
            )}
          </div>

          {/* Secret Access Key */}
          <div>
            <label
              htmlFor="secretAccessKey"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Secret Access Key
            </label>
            <input
              id="secretAccessKey"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.secretAccessKey ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.secretAccessKey && (
              <p className="mt-1 text-xs text-red-400">{errors.secretAccessKey}</p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <div>
            {config && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Clear Config
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
