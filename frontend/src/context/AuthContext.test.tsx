import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../context/AuthContext.tsx';
import * as authApi from '../api/auth.ts';

vi.mock('../api/auth.ts', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  resendOtp: vi.fn(),
  forgotPassword: vi.fn(),
  verifyPasswordResetOtp: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../api/cart.ts', () => ({
  mergeCart: vi.fn().mockResolvedValue({
    cart: {
      id: 'cart-1',
      status: 'active',
      item_count: 0,
      items: [],
      totals: {
        subtotal: '0.00',
        discount: null,
        shipping: null,
        tax: null,
        total: null,
      },
    },
    warnings: [],
  }),
}));

vi.mock('../hooks/useToast.ts', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(null);
  });

  it('starts unauthenticated when /me returns null', async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });
  });

  it('sets authenticated user after login', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Test',
        phone: '966501234567',
        email: null,
        status: 'active',
        phone_verified_at: null,
        email_verified_at: null,
        roles: [{ id: '1', name: 'customer', label: 'Customer', status: 'active' }],
      },
      message: 'Signed in successfully.',
    });

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    const user = await result.current.login({
      method: 'phone',
      identifier: '501234567',
      password: 'Password123!',
    });

    expect(user.user.id).toBe('user-1');
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('clears session when unauthorized event fires', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValueOnce({
      id: 'user-1',
      name: 'Test',
      phone: '966501234567',
      email: null,
      status: 'active',
      phone_verified_at: null,
      email_verified_at: null,
      roles: [],
    });

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    const { notifyUnauthorized } = await import('../lib/auth/sessionEvents.ts');
    notifyUnauthorized();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('logout clears authenticated state', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValueOnce({
      id: 'user-1',
      name: 'Test',
      phone: '966501234567',
      email: null,
      status: 'active',
      phone_verified_at: null,
      email_verified_at: null,
      roles: [],
    });
    vi.mocked(authApi.logout).mockResolvedValue({ message: 'Signed out successfully.' });

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await result.current.logout();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
