import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../types';
import { clearCacheForSessionChange, syncCacheMode } from '../utils/apiCache';

export type AuthMode = 'owner' | 'demo' | 'loading';
export type LoginResult = 'ok' | 'wrong' | { lockedFor: number };

interface AuthContextValue {
  mode: AuthMode;
  lockedFor: number;
  login: (pin: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getRetryAfter = (error: ApiError): number => {
  const details = error.details as { retry_after?: unknown } | undefined;
  return typeof details?.retry_after === 'number' ? details.retry_after : 60;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AuthMode>('loading');
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((status) => {
        if (cancelled) return;
        syncCacheMode(status.mode);
        setMode(status.mode);
        setLockedFor(status.login_locked_for);
      })
      .catch(() => {
        // Unreachable backend: the connection indicator reports it; assume the safe mode.
        if (!cancelled) setMode('demo');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (pin: string): Promise<LoginResult> => {
    try {
      await authApi.login(pin);
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 429) {
        const seconds = getRetryAfter(error);
        setLockedFor(seconds);
        return { lockedFor: seconds };
      }
      if (error.status === 401 || error.status === 422) return 'wrong';
      throw err;
    }
    // Refetch everything under the new session.
    clearCacheForSessionChange();
    window.location.reload();
    return 'ok';
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Reload regardless; the server decides the resulting mode.
    }
    clearCacheForSessionChange();
    window.location.reload();
  }, []);

  const value = useMemo(() => ({ mode, lockedFor, login, logout }), [mode, lockedFor, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
