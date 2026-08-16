import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth.ts';
import { registerUnauthorizedHandler } from '../lib/auth/sessionEvents.ts';
import { resetCsrfCookie } from '../lib/csrf.ts';
import type {
  AuthActionResult,
  AuthState,
  AuthUser,
  AuthUserResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from '../types/auth.ts';
import { parseApiError } from '../utils/errors.ts';

type AuthContextValue = {
  user: AuthUser | null;
  roles: AuthUser['roles'];
  status: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthUserResult>;
  register: (payload: RegisterPayload) => Promise<AuthUserResult>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<AuthUserResult>;
  resendOtp: (phone: string) => Promise<AuthActionResult>;
  forgotPassword: (phone: string) => Promise<AuthActionResult>;
  verifyPasswordResetOtp: (payload: VerifyOtpPayload) => Promise<AuthActionResult>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (user: AuthUser) => void;
  clearError: () => void;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function hasSessionCookie(): boolean {
  return document.cookie.split(';').some((part) => part.trim().startsWith('laravel_session='));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
    resetCsrfCookie();
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const onAuthPage = window.location.pathname.startsWith('/auth');
    if (onAuthPage && !hasSessionCookie()) {
      clearSession();
      return null;
    }

    const currentUser = await authApi.fetchCurrentUser();

    if (currentUser === null) {
      clearSession();
      return null;
    }

    setUser(currentUser);
    setStatus('authenticated');
    return currentUser;
  }, [clearSession]);

  const updateUser = useCallback((next: AuthUser) => {
    setUser(next);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => registerUnauthorizedHandler(clearSession), [clearSession]);

  const wrap = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setError(null);
    try {
      return await action();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      roles: user?.roles,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      error,
      login: (payload) =>
        wrap(async () => {
          const result = await authApi.login(payload);
          setUser(result.user);
          setStatus('authenticated');
          return result;
        }),
      register: (payload) => wrap(() => authApi.register(payload)),
      verifyOtp: (payload) =>
        wrap(async () => {
          const result = await authApi.verifyOtp(payload);
          setUser(result.user);
          setStatus('authenticated');
          return result;
        }),
      resendOtp: (phone) => wrap(() => authApi.resendOtp(phone)),
      forgotPassword: (phone) => wrap(() => authApi.forgotPassword(phone)),
      verifyPasswordResetOtp: (payload) => wrap(() => authApi.verifyPasswordResetOtp(payload)),
      resetPassword: (payload) => wrap(() => authApi.resetPassword(payload)),
      logout: () =>
        wrap(async () => {
          try {
            return await authApi.logout();
          } finally {
            clearSession();
          }
        }),
      refreshUser,
      updateUser,
      clearError: () => setError(null),
      hasRole: (role) => user?.roles?.some((r) => r.name === role) ?? false,
    }),
    [user, status, error, wrap, refreshUser, updateUser, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
