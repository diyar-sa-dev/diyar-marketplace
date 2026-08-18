import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type VendorTeamRole = 'owner' | 'manager' | 'customer_service';
export type VendorTeamStatus = 'invited' | 'active' | 'removed';

export type VendorTeamMember = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  avatar_url?: string | null;
  role: VendorTeamRole;
  status: VendorTeamStatus;
  is_owner: boolean;
};

export type VendorAccessPermissions = {
  dashboard: boolean;
  orders: boolean | string;
  returns: boolean | string;
  products: boolean | string;
  products_delete: boolean;
  finance: boolean | string;
  finance_withdraw: boolean;
  settings: boolean;
  team: boolean;
  reviews: boolean | string;
  chat: boolean;
};

export type VendorAccess = {
  role: VendorTeamRole;
  permissions: VendorAccessPermissions;
  vendor_account_id: string;
};

type TeamListResponse = ApiSuccessResponse<{
  items: VendorTeamMember[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}>;

type AccessResponse = ApiSuccessResponse<{ access: VendorAccess }>;

export async function fetchVendorAccess(): Promise<VendorAccess> {
  const { data } = await apiClient.get<AccessResponse>('/dashboard/vendor/access');
  return data.data.access;
}

export function vendorCanWrite(permission: boolean | string | undefined): boolean {
  return permission === true || permission === 'write';
}

export async function fetchVendorTeam(page = 1, perPage = 10, status?: 'active' | 'invited') {
  const { data } = await apiClient.get<TeamListResponse>('/dashboard/vendor/team', {
    params: { page, per_page: perPage, status },
  });
  return data.data;
}

export async function inviteVendorTeamMember(payload: {
  email: string;
  role: Exclude<VendorTeamRole, 'owner'>;
  locale?: 'ar' | 'en';
}) {
  const { data } = await apiClient.post('/dashboard/vendor/team/invite', payload);
  return data;
}

export async function updateVendorTeamMember(id: string, role: Exclude<VendorTeamRole, 'owner'>) {
  const { data } = await apiClient.patch(`/dashboard/vendor/team/${id}`, { role });
  return data;
}

export async function removeVendorTeamMember(id: string) {
  const { data } = await apiClient.delete(`/dashboard/vendor/team/${id}`);
  return data;
}
