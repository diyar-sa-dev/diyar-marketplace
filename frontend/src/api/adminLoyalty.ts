import { adminApi } from '../api/client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { LoyaltySummary, LoyaltyTransaction } from '../api/loyalty.ts';

export type AdminCustomerLoyalty = {
  customer: { id: string; name: string; email?: string | null };
  loyalty: LoyaltySummary;
  recent_transactions: LoyaltyTransaction[];
};

export async function fetchAdminCustomerLoyalty(userId: string): Promise<AdminCustomerLoyalty> {
  const { data } = await adminApi.get<ApiSuccessResponse<AdminCustomerLoyalty>>(
    `/admin/loyalty/customers/${userId}`,
  );
  return data.data;
}

export async function adjustAdminCustomerLoyalty(
  userId: string,
  payload: { points: number; direction: 'credit' | 'debit'; reason: string },
): Promise<{ transaction: LoyaltyTransaction; loyalty: LoyaltySummary }> {
  const { data } = await adminApi.post<
    ApiSuccessResponse<{ transaction: LoyaltyTransaction; loyalty: LoyaltySummary }>
  >(`/admin/loyalty/customers/${userId}/adjust`, payload);
  return data.data;
}
