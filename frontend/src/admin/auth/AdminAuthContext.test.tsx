import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext.tsx';
import * as adminAuthApi from '../../api/adminAuth.ts';

const mockPathname = vi.fn(() => '/admin');

vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: mockPathname(),
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}));

vi.mock('../../api/adminAuth.ts', () => ({
  fetchAdminSession: vi.fn(),
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
}));

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    toasts: [],
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}

describe('AdminAuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPathname.mockReturnValue('/admin');
    vi.mocked(adminAuthApi.fetchAdminSession).mockResolvedValue(null);
  });

  it('bootstraps admin session only on admin routes', async () => {
    mockPathname.mockReturnValue('/admin');
    vi.mocked(adminAuthApi.fetchAdminSession).mockResolvedValueOnce({
      user: {
        id: 'admin-1',
        name: 'Ops',
        phone: '966501234567',
        email: 'ops@diyar.test',
        status: 'active',
        phone_verified_at: null,
        email_verified_at: null,
        roles: [{ id: '1', name: 'admin', label: 'Admin', status: 'active' }],
      },
      permissions: ['users.view'],
    });

    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(adminAuthApi.fetchAdminSession).toHaveBeenCalled();
  });

  it('does not call admin session API on marketplace routes', async () => {
    mockPathname.mockReturnValue('/profile');

    renderHook(() => useAdminAuth(), { wrapper });

    await waitFor(() => {
      expect(adminAuthApi.fetchAdminSession).not.toHaveBeenCalled();
    });
  });
});
