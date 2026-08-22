import { adminApi } from '../../api/client.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

export type AdminDashboardMetrics = {
  orders_today: number;
  pending_vendor_payouts: number;
  pending_affiliate_payouts: number;
  active_users: number;
  vendors: number;
  providers: number;
  service_requests_open: number;
  bookings_active: number;
  recent_activity: Array<{
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    created_at: string;
  }>;
};

type DashboardResponse = ApiSuccessResponse<{ metrics: AdminDashboardMetrics }>;

export async function fetchAdminDashboard(): Promise<AdminDashboardMetrics> {
  const response = await adminApi.get<DashboardResponse>('/admin/dashboard');
  return response.data.data.metrics;
}
