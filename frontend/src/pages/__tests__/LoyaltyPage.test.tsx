import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import LoyaltyPage from '../LoyaltyPage.tsx';

const mockUseAuth = vi.fn();
const mockUseLoyaltySummary = vi.fn();
const mockUseLoyaltyTransactions = vi.fn();
const mockUseLoyaltyRewards = vi.fn();

vi.mock('../../hooks/auth/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../hooks/loyalty/useLoyalty.ts', () => ({
  useLoyaltySummary: () => mockUseLoyaltySummary(),
  useLoyaltyTransactions: () => mockUseLoyaltyTransactions(),
  useLoyaltyRewards: () => mockUseLoyaltyRewards(),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter>
          <LoyaltyPage />
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('LoyaltyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'u1' } });
    mockUseLoyaltySummary.mockReturnValue({
      data: {
        balance: 120,
        total_earned: 200,
        total_redeemed: 80,
        total_reversed: 0,
        total_adjusted: 0,
        enabled: true,
        sar_per_point: 50,
        points_per_unit: 1,
      },
      isLoading: false,
      isError: false,
    });
    mockUseLoyaltyTransactions.mockReturnValue({
      data: {
        items: [
          {
            id: 'tx1',
            type: 'earn',
            points: 10,
            balance_after: 120,
            description: 'Points earned from order #1001.',
            order_id: 'o1',
            eligible_amount: '500.00',
            created_at: '2026-08-25T10:00:00+00:00',
          },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      },
      isLoading: false,
      isError: false,
      isFetching: false,
    });
    mockUseLoyaltyRewards.mockReturnValue({
      data: { items: [], available: false },
      isLoading: false,
    });
  });

  it('renders balance and transaction history from API data', () => {
    renderPage();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/Points earned from order|نقاط مكتسبة/i)).toBeInTheDocument();
    expect(screen.getByText(/No rewards available|لا توجد مكافآت/i)).toBeInTheDocument();
  });

  it('shows guest sign-in prompt when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

    renderPage();

    expect(screen.getByText(/Sign in to view your points|سجّل/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign in|تسجيل/i })).toBeInTheDocument();
  });

  it('shows balance skeleton while summary loads', () => {
    mockUseLoyaltySummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    mockUseLoyaltyTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: false,
    });

    renderPage();

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows error state with retry when summary fails', () => {
    mockUseLoyaltySummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/Unable to load loyalty balance|تعذر تحميل/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again|إعادة/i })).toBeInTheDocument();
  });

  it('shows disabled program notice while preserving balance context', () => {
    mockUseLoyaltySummary.mockReturnValue({
      data: {
        balance: 50,
        total_earned: 50,
        total_redeemed: 0,
        total_reversed: 0,
        total_adjusted: 0,
        enabled: false,
        sar_per_point: 50,
        points_per_unit: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText(/currently disabled|متوقف/i)).toBeInTheDocument();
  });
});
