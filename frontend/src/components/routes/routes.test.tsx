import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { GuestRoute } from './GuestRoute.tsx';

const mockAuth = vi.fn();

vi.mock('../../context/AuthContext.tsx', () => ({
  useAuthContext: () => mockAuth(),
}));

function renderWithLocale(ui: React.ReactNode) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuth.mockReturnValue({
      status: 'loading',
      isAuthenticated: false,
      hasRole: () => false,
    });
  });

  it('shows loading state while session is checked', () => {
    renderWithLocale(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Private</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('جاري التحقق من الجلسة...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to auth', () => {
    mockAuth.mockReturnValue({
      status: 'unauthenticated',
      isAuthenticated: false,
      hasRole: () => false,
      user: null,
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Private</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Auth')).toBeInTheDocument();
  });

  it('redirects pending users to pending account page', () => {
    mockAuth.mockReturnValue({
      status: 'authenticated',
      isAuthenticated: true,
      hasRole: () => false,
      user: { status: 'pending', roles: [] },
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Private</div>
              </ProtectedRoute>
            }
          />
          <Route path="/account/pending" element={<div>Pending</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('redirects authenticated users away from login', () => {
    mockAuth.mockReturnValue({
      status: 'authenticated',
      isAuthenticated: true,
      user: { status: 'active', roles: [{ name: 'customer' }] },
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route
            path="/auth"
            element={
              <GuestRoute>
                <div>Login Form</div>
              </GuestRoute>
            }
          />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('redirects pending users to pending account page', () => {
    mockAuth.mockReturnValue({
      status: 'authenticated',
      isAuthenticated: true,
      user: { status: 'pending', roles: [] },
    });

    renderWithLocale(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route
            path="/auth"
            element={
              <GuestRoute>
                <div>Login Form</div>
              </GuestRoute>
            }
          />
          <Route path="/account/pending" element={<div>Pending</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
