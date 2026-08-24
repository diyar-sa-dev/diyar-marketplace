/* eslint-disable react-refresh/only-export-components -- context module exports provider and hooks together */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import * as adminAuthApi from '../../api/adminAuth.ts';
import { resolveApplicationContext } from '../../lib/auth/applicationContext.ts';
import { isAdminQueryKey } from '../../lib/auth/queryKeys.ts';
import { registerUnauthorizedHandler } from '../../lib/auth/sessionEvents.ts';
import { queryClient } from '../../lib/queryClient.ts';
import { RoleName } from '../../lib/auth/roles.ts';
import type { AuthActionResult, AuthState, AuthUser } from '../../types/auth.ts';

type AdminAuthContextValue = {
  user: AuthUser | null;
  permissions: string[];
  status: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: Parameters<typeof adminAuthApi.loginAdmin>[0]) => Promise<AuthUser>;
  logout: () => Promise<AuthActionResult>;
  refreshSession: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser, permissions?: string[]) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const applicationContext = resolveApplicationContext(location.pathname);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<AuthState>('loading');

  const clearSession = useCallback(() => {
    setUserState(null);
    setPermissions([]);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    setStatus('loading');

    try {
      const session = await adminAuthApi.fetchAdminSession();

      if (session === null) {
        clearSession();
        return null;
      }

      setUserState(session.user);
      setPermissions(session.permissions);
      setStatus('authenticated');
      return session.user;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    if (applicationContext !== 'admin') {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [applicationContext, refreshSession]);

  useEffect(() => {
    return registerUnauthorizedHandler('admin', () => {
      void (async () => {
        const session = await adminAuthApi.fetchAdminSession();
        if (session === null) {
          clearSession();
        }
      })();
    });
  }, [clearSession]);

  const setUser = useCallback((next: AuthUser, nextPermissions?: string[]) => {
    setUserState(next);
    if (nextPermissions) {
      setPermissions(nextPermissions);
    }
    setStatus('authenticated');
  }, []);

  const login = useCallback(async (payload: Parameters<typeof adminAuthApi.loginAdmin>[0]) => {
    const result = await adminAuthApi.loginAdmin(payload);
    setUserState(result.user);
    setStatus('authenticated');

    const session = await adminAuthApi.fetchAdminSession();
    if (session) {
      setPermissions(session.permissions);
    }

    return result.user;
  }, []);

  const logout = useCallback(async (): Promise<AuthActionResult> => {
    try {
      return await adminAuthApi.logoutAdmin();
    } finally {
      clearSession();
      queryClient.removeQueries({
        predicate: (query) => isAdminQueryKey(query.queryKey),
      });
    }
  }, [clearSession]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      permissions,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      logout,
      refreshSession,
      setUser,
      hasRole: (role) => user?.roles?.some((entry) => entry.name === role) ?? false,
      hasPermission: (permission) => permissions.includes(permission),
    }),
    [user, permissions, status, login, logout, refreshSession, setUser],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}

export function useAdminHasPermission(permission: string): boolean {
  const { hasPermission } = useAdminAuth();
  return hasPermission(permission);
}

export function useAdminIsAdmin(): boolean {
  const { hasRole } = useAdminAuth();
  return hasRole(RoleName.Admin);
}
