import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import SecurityPage from '../SecurityPage.tsx';

const mockUseAuth = vi.fn();
const mockUseSecuritySessions = vi.fn();
const mockUseRevokeSecuritySession = vi.fn();
const mockUseLogoutOtherSecuritySessions = vi.fn();

vi.mock('../../hooks/auth/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/profile/useSecuritySessions.ts', () => ({
  useSecuritySessions: () => mockUseSecuritySessions(),
  useRevokeSecuritySession: () => mockUseRevokeSecuritySession(),
  useLogoutOtherSecuritySessions: () => mockUseLogoutOtherSecuritySessions(),
}));

const sessions = [
  {
    id: 'sess-current',
    device_type: 'desktop' as const,
    browser: 'Chrome',
    browser_version: '120',
    platform: 'Windows',
    platform_version: '10',
    device_name: 'Windows computer',
    country: 'SA',
    city: 'Riyadh',
    region: null,
    location_source: 'proxy_header',
    is_current: true,
    first_seen_at: '2026-09-08T10:00:00+00:00',
    last_activity_at: '2026-09-08T12:00:00+00:00',
  },
  {
    id: 'sess-other',
    device_type: 'mobile' as const,
    browser: 'Safari',
    browser_version: '17',
    platform: 'iOS',
    platform_version: '17',
    device_name: 'iPhone',
    country: null,
    city: null,
    region: null,
    location_source: 'unknown',
    is_current: false,
    first_seen_at: '2026-09-07T10:00:00+00:00',
    last_activity_at: '2026-09-07T18:00:00+00:00',
  },
];

function renderPage(locale: 'ar' | 'en' = 'ar') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  window.localStorage.setItem('diyar-locale', locale);

  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter>
          <SecurityPage />
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { phone: '966500000010', roles: ['customer'] },
    });
    mockUseSecuritySessions.mockReturnValue({
      data: sessions,
      isLoading: false,
      isError: false,
    });
    mockUseRevokeSecuritySession.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseLogoutOtherSecuritySessions.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders device list with current device badge', () => {
    renderPage('en');
    expect(screen.getByText(/Connected devices/i)).toBeInTheDocument();
    expect(screen.getByText(/This device/i)).toBeInTheDocument();
    expect(screen.getByText(/iPhone/i)).toBeInTheDocument();
  });

  it('shows loading indicator', () => {
    mockUseSecuritySessions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderPage('en');
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state when no sessions', () => {
    mockUseSecuritySessions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    renderPage('en');
    expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
  });

  it('shows API failure message', () => {
    mockUseSecuritySessions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderPage('en');
    expect(screen.getByText(/Could not load active sessions/i)).toBeInTheDocument();
  });

  it('calls revoke mutation for remote device', () => {
    const mutate = vi.fn();
    mockUseRevokeSecuritySession.mockReturnValue({ mutate, isPending: false });
    renderPage('en');
    fireEvent.click(screen.getByRole('button', { name: 'Sign out', exact: true }));
    expect(mutate).toHaveBeenCalledWith('sess-other');
  });

  it('opens logout-others confirmation dialog', () => {
    renderPage('en');
    fireEvent.click(screen.getByRole('button', { name: /Sign out others/i }));
    expect(screen.getByText(/Sign out other devices/i)).toBeInTheDocument();
  });

  it('renders Arabic RTL copy', () => {
    renderPage('ar');
    expect(screen.getByText(/الأجهزة المتصلة/)).toBeInTheDocument();
    expect(screen.getByText(/هذا الجهاز/)).toBeInTheDocument();
  });
});
