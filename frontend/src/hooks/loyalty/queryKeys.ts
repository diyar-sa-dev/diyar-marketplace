import type { LoyaltyTransactionFilter } from '../../api/loyalty.ts';

export const loyaltyKeys = {
  all: ['loyalty'] as const,
  summary: () => [...loyaltyKeys.all, 'summary'] as const,
  transactions: (type: LoyaltyTransactionFilter, page: number, perPage: number) =>
    [...loyaltyKeys.all, 'transactions', type, page, perPage] as const,
  rewards: () => [...loyaltyKeys.all, 'rewards'] as const,
};
