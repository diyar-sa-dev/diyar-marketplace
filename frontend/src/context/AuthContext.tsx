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
import { queryClient } from '../lib/queryClient.ts';
import { mergeCart } from '../api/cart.ts';
import { cartKeys } from '../hooks/cart/queryKeys.ts';
import { cartSync } from '../hooks/cart/cartSync.ts';
import { productKeys } from '../hooks/catalog/queryKeys.ts';
import { wishlistKeys } from '../hooks/profile/queryKeys.ts';
import { useToast } from '../hooks/useToast.ts';
import type {
  AuthActionResult,
  AuthState,
  AuthUser,
  AuthUserResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailOtpPayload,
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
  verifyEmailOtp: (payload: VerifyEmailOtpPayload) => Promise<AuthUserResult>;
  resendOtp: (phone: string) => Promise<AuthActionResult>;
  resendEmailOtp: (email: string) => Promise<AuthActionResult>;
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

function invalidateUserScopedQueries(): void {
  void queryClient.invalidateQueries({ queryKey: productKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
  void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
}

async function mergeGuestCartAfterAuth(showWarning: (message: string) => void): Promise<void> {
  try {
    await cartSync.flush();
    const result = await mergeCart();
    cartSync.applyServerCart(result.cart, false);
    queryClient.setQueryData(cartKeys.mergeWarnings(), result.warnings);
    result.warnings.forEach((warning) => showWarning(warning));
  } catch {
    void queryClient.invalidateQueries({ queryKey: cartKeys.detail() });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
    resetCsrfCookie();
    invalidateUserScopedQueries();
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
          invalidateUserScopedQueries();
          await mergeGuestCartAfterAuth((message) => toast.warning(message));
          return result;
        }),
      register: (payload) => wrap(() => authApi.register(payload)),
      verifyOtp: (payload) =>
        wrap(async () => {
          const result = await authApi.verifyOtp(payload);
          setUser(result.user);
          setStatus('authenticated');
          invalidateUserScopedQueries();
          await mergeGuestCartAfterAuth((message) => toast.warning(message));
          return result;
        }),
      verifyEmailOtp: (payload) =>
        wrap(async () => {
          const result = await authApi.verifyEmailOtp(payload);
          setUser(result.user);
          setStatus('authenticated');
          invalidateUserScopedQueries();
          await mergeGuestCartAfterAuth((message) => toast.warning(message));
          return result;
        }),
      resendOtp: (phone) => wrap(() => authApi.resendOtp(phone)),
      resendEmailOtp: (email) => wrap(() => authApi.resendEmailOtp(email)),
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
