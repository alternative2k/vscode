import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types/auth';

const AUTH_STORAGE_KEY = 'formcheck_user';

/**
 * Parse VITE_USERS env var as JSON array of User objects.
 * Falls back to single user from VITE_APP_PASSWORD for backward compatibility.
 */
function getUsers(): User[] {
  // Check VITE_USERS first (multi-user config)
  const usersJson = import.meta.env.VITE_USERS;
  if (usersJson) {
    try {
      const parsed = JSON.parse(usersJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as User[];
      }
    } catch (e) {
      console.error('Failed to parse VITE_USERS:', e);
    }
  }

  // Fallback to single user from VITE_APP_PASSWORD
  const fallbackUser: User = {
    id: 'default',
    name: 'User',
    password: import.meta.env.VITE_APP_PASSWORD || 'formcheck2024',
    isAdmin: true
  };

  return [fallbackUser];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage on initial load
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Sync state with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = useCallback((password: string): User | null => {
    const users = getUsers();
    const matchedUser = users.find(u => u.password === password);

    if (matchedUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
      setUser(matchedUser);
      return matchedUser;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  return {
    isAuthed: user !== null,
    user,
    login,
    logout
  };
}
