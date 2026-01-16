import { useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'formcheck_authed';

// Password from environment variable or fallback to development default
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'formcheck2024';

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    // Check localStorage on initial load
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  // Sync state with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    setIsAuthed(stored);
  }, []);

  const login = useCallback((password: string): boolean => {
    if (password === APP_PASSWORD) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthed(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthed(false);
  }, []);

  return { isAuthed, login, logout };
}
