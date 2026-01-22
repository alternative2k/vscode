import { useState, useEffect, useCallback, useRef } from 'react';

interface LockState {
  isLocked: boolean;
  isLoading: boolean;
}

interface UseAppLockReturn {
  isLocked: boolean;
  isLoading: boolean;
  toggleLock: () => Promise<void>;
}

const POLL_INTERVAL = 30000; // 30 seconds

export function useAppLock(): UseAppLockReturn {
  const [state, setState] = useState<LockState>({
    isLocked: false,
    isLoading: true,
  });
  const pollIntervalRef = useRef<number | null>(null);

  const fetchLockStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/app-lock');
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          isLocked: data.locked ?? false,
          isLoading: false,
        }));
      } else {
        // Default to unlocked on error
        setState(prev => ({ ...prev, isLocked: false, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch lock status:', error);
      // Default to unlocked if API fails
      setState(prev => ({ ...prev, isLocked: false, isLoading: false }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLockStatus();
  }, [fetchLockStatus]);

  // Poll every 30 seconds
  useEffect(() => {
    pollIntervalRef.current = window.setInterval(fetchLockStatus, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchLockStatus]);

  const toggleLock = useCallback(async () => {
    const newLocked = !state.isLocked;

    // Optimistic update
    setState(prev => ({ ...prev, isLocked: newLocked }));

    try {
      const response = await fetch('/api/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: newLocked }),
      });

      if (!response.ok) {
        // Revert on failure
        setState(prev => ({ ...prev, isLocked: !newLocked }));
        console.error('Failed to toggle lock status');
      }
    } catch (error) {
      // Revert on error
      setState(prev => ({ ...prev, isLocked: !newLocked }));
      console.error('Failed to toggle lock status:', error);
    }
  }, [state.isLocked]);

  return {
    isLocked: state.isLocked,
    isLoading: state.isLoading,
    toggleLock,
  };
}
