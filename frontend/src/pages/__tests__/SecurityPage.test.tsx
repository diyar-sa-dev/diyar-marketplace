import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import SecurityPage from '../SecurityPage.tsx';

const mockUseAuth = vi.fn();
const mockUseSecuritySessions = vi.fn();
const mockUseRevokeSecuritySession = vi.fn();
const mockUseRevokeSecurityDevice = vi.fn();
const mockUseLogoutOtherSecuritySessions = vi.fn();
const mockUseTwoFactorStatus = vi.fn();
const mockUseEnableTwoFactor = vi.fn();
const mockUseConfirmTwoFactor = vi.fn();
const mockUseDisableTwoFactor = vi.fn();

vi.mock('../../hooks/auth/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/profile/useTwoFactor.ts', () => ({
  useTwoFactorStatus: () => mockUseTwoFactorStatus(),
  useEnableTwoFactor: () => mockUseEnableTwoFactor(),
  useConfirmTwoFactor: () => mockUseConfirmTwoFactor(),
  useDisableTwoFactor: () => mockUseDisableTwoFactor(),
}));

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }),
}));

vi.mock('../../hooks/profile/useSecuritySessions.ts', () => ({
  useSecuritySessions: () => mockUseSecuritySessions(),
  useRevokeSecuritySession: () => mockUseRevokeSecuritySession(),
  useRevokeSecurityDevice: () => mockUseRevokeSecurityDevice(),
  useLogoutOtherSecuritySessions: () => mockUseLogoutOtherSecuritySessions(),
}));

const devices = [
  {
    fingerprint: 'device-current',
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
    ip_address: '203.0.113.10',
    is_local_ip: false,
    is_current: true,
    session_count: 1,
    first_seen_at: '2026-09-08T10:00:00+00:00',
    last_activity_at: '2026-09-08T12:00:00+00:00',
    sessions: [
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
        ip_address: '203.0.113.10',
        is_local_ip: false,
        is_current: true,
        first_seen_at: '2026-09-08T10:00:00+00:00',
        last_activity_at: '2026-09-08T12:00:00+00:00',
      },
    ],
  },
  {
    fingerprint: 'device-other',
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
    ip_address: '198.51.100.4',
    is_local_ip: false,
    is_current: false,
    session_count: 1,
    first_seen_at: '2026-09-07T10:00:00+00:00',
    last_activity_at: '2026-09-07T18:00:00+00:00',
    sessions: [
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
        ip_address: '198.51.100.4',
        is_local_ip: false,
        is_current: false,
        first_seen_at: '2026-09-07T10:00:00+00:00',
        last_activity_at: '2026-09-07T18:00:00+00:00',
      },
    ],
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
      updateUser: vi.fn(),
    });
    mockUseTwoFactorStatus.mockReturnValue({
      data: { enabled: false, confirmed_at: null, phone_masked: '0500000010' },
      isLoading: false,
    });
    mockUseEnableTwoFactor.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseConfirmTwoFactor.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseDisableTwoFactor.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockUseSecuritySessions.mockReturnValue({
      data: devices,
      isLoading: false,
      isError: false,
    });
    mockUseRevokeSecuritySession.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseRevokeSecurityDevice.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseLogoutOtherSecuritySessions.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders device list with current device badge and IP address', () => {
    renderPage('en');
    expect(screen.getByText(/Connected devices/i)).toBeInTheDocument();
    expect(screen.getByText(/This device/i)).toBeInTheDocument();
    expect(screen.getByText(/203\.0\.113\.10/)).toBeInTheDocument();
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

  it('calls device revoke mutation for remote device', () => {
    const mutate = vi.fn();
    mockUseRevokeSecurityDevice.mockReturnValue({ mutate, isPending: false });
    renderPage('en');
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign out device' })[0]);
    expect(mutate).toHaveBeenCalledWith(devices[1]);
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

  it('renders two-factor panel with disabled status', () => {
    renderPage('en');
    expect(screen.getByText(/Two-factor authentication \(2FA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/^Disabled$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enable 2FA/i })).toBeInTheDocument();
  });

  it('renders two-factor enabled status in Arabic', () => {
    mockUseTwoFactorStatus.mockReturnValue({
      data: { enabled: true, confirmed_at: '2026-09-11T10:00:00+00:00', phone_masked: '0500000010' },
      isLoading: false,
    });
    renderPage('ar');
    expect(screen.getByText(/مفعّل/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إيقاف 2FA/i })).toBeInTheDocument();
  });
});
