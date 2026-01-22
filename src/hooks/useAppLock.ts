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
const TOGGLE_COOLDOWN = 5000; // 5 seconds - ignore polls after toggle to prevent race condition

export function useAppLock(): UseAppLockReturn {
  const [state, setState] = useState<LockState>({
    isLocked: false,
    isLoading: true,
  });
  const pollIntervalRef = useRef<number | null>(null);
  // Track when toggle was last called to prevent poll from overwriting optimistic update
  const lastToggleTimeRef = useRef<number>(0);

  const fetchLockStatus = useCallback(async (isInitialFetch = false) => {
    // Skip poll if within cooldown period after a toggle (prevents race condition)
    // Always allow initial fetch on mount
    if (!isInitialFetch && Date.now() - lastToggleTimeRef.current < TOGGLE_COOLDOWN) {
      return;
    }

    try {
      const response = await fetch('/api/app-lock');
      if (response.ok) {
        const data = await response.json();
        // Double-check we're still outside cooldown (in case toggle happened during fetch)
        if (isInitialFetch || Date.now() - lastToggleTimeRef.current >= TOGGLE_COOLDOWN) {
          setState(prev => ({
            ...prev,
            isLocked: data.locked ?? false,
            isLoading: false,
          }));
        }
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

  // Fetch on mount (initial fetch - always allowed)
  useEffect(() => {
    fetchLockStatus(true);
  }, [fetchLockStatus]);

  // Poll every 30 seconds
  useEffect(() => {
    pollIntervalRef.current = window.setInterval(() => fetchLockStatus(false), POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchLockStatus]);

  const toggleLock = useCallback(async () => {
    const newLocked = !state.isLocked;

    // Mark toggle time to prevent poll from overwriting during cooldown
    lastToggleTimeRef.current = Date.now();

    // Optimistic update
    setState(prev => ({ ...prev, isLocked: newLocked }));

    try {
      const response = await fetch('/api/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: newLocked }),
      });

      if (!response.ok) {
        // Revert on failure and clear cooldown to allow poll to correct state
        lastToggleTimeRef.current = 0;
        setState(prev => ({ ...prev, isLocked: !newLocked }));
        console.error('Failed to toggle lock status');
      }
    } catch (error) {
      // Revert on error and clear cooldown to allow poll to correct state
      lastToggleTimeRef.current = 0;
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
