import { useQuery } from '@tanstack/react-query';
import {
  fetchLoyaltyRewards,
  fetchLoyaltySummary,
  fetchLoyaltyTransactions,
  type LoyaltyTransactionFilter,
} from '../../api/loyalty.ts';
import { loyaltyKeys } from './queryKeys.ts';

export function useLoyaltySummary(enabled = true) {
  return useQuery({
    queryKey: loyaltyKeys.summary(),
    queryFn: fetchLoyaltySummary,
    enabled,
    staleTime: 30_000,
  });
}

export function useLoyaltyTransactions(
  type: LoyaltyTransactionFilter,
  page: number,
  perPage: number,
  enabled = true,
) {
  return useQuery({
    queryKey: loyaltyKeys.transactions(type, page, perPage),
    queryFn: () => fetchLoyaltyTransactions(type, page, perPage),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useLoyaltyRewards(enabled = true) {
  return useQuery({
    queryKey: loyaltyKeys.rewards(),
    queryFn: fetchLoyaltyRewards,
    enabled,
    staleTime: 60_000,
  });
}
