import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import LoyaltyPage from '../LoyaltyPage.tsx';

vi.mock('../../hooks/auth/useAuth.ts', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'u1' } }),
}));

vi.mock('../../hooks/loyalty/useLoyalty.ts', () => ({
  useLoyaltySummary: () => ({
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
  }),
  useLoyaltyTransactions: () => ({
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
  }),
  useLoyaltyRewards: () => ({
    data: { items: [], available: false },
    isLoading: false,
  }),
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
  });

  it('renders balance and transaction history from API data', () => {
    renderPage();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/Points earned from order|نقاط مكتسبة/i)).toBeInTheDocument();
    expect(screen.getByText(/No rewards available|لا توجد مكافآت/i)).toBeInTheDocument();
  });
});
