import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type LoyaltySummary = {
  balance: number;
  total_earned: number;
  total_redeemed: number;
  total_reversed: number;
  total_adjusted: number;
  enabled: boolean;
  sar_per_point: number;
  points_per_unit: number;
};

export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjust' | 'reversal';

export type LoyaltyTransaction = {
  id: string;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  description: string | null;
  order_id: string | null;
  eligible_amount: string | null;
  created_at: string | null;
};

export type LoyaltyTransactionFilter = 'all' | LoyaltyTransactionType;

export async function fetchLoyaltySummary(): Promise<LoyaltySummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ loyalty: LoyaltySummary }>>('/loyalty');
  return data.data.loyalty;
}

export async function fetchLoyaltyTransactions(
  type: LoyaltyTransactionFilter = 'all',
  page = 1,
  perPage = 20,
): Promise<{
  items: LoyaltyTransaction[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      items: LoyaltyTransaction[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>
  >('/loyalty/transactions', {
    params: {
      type: type === 'all' ? undefined : type,
      page,
      per_page: perPage,
    },
  });

  return {
    items: data.data.items ?? [],
    pagination: data.data.pagination,
  };
}

export async function fetchLoyaltyRewards(): Promise<{ items: unknown[]; available: boolean }> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<{ items: unknown[]; available: boolean }>>(
      '/loyalty/rewards',
    );
  return data.data;
}
