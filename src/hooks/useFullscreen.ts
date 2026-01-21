import { useState, useEffect, useCallback } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isSupported: boolean;
}

/**
 * Hook to manage fullscreen mode with cross-browser support.
 * Handles vendor-prefixed APIs for Safari and tracks state changes
 * when user exits fullscreen via Escape key.
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if fullscreen is supported (Safari iOS does not support it for non-video elements)
  const isSupported = typeof document !== 'undefined' && (
    'fullscreenEnabled' in document ||
    'webkitFullscreenEnabled' in document
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!isSupported) return;

    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void>;
      };
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };

      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        // Enter fullscreen
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          // Safari
          await docEl.webkitRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          // Safari
          await doc.webkitExitFullscreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }, [isSupported]);

  // Listen for fullscreen changes (user pressing Escape or programmatic changes)
  useEffect(() => {
    if (!isSupported) return;

    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const isInFullscreen = !!(document.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(isInFullscreen);
    };

    // Standard event
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Safari vendor-prefixed event
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Set initial state
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isSupported]);

  return {
    isFullscreen,
    toggleFullscreen,
    isSupported,
  };
}
