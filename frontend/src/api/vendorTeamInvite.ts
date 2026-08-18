import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type TeamInvitePreview = {
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  store_name: string | null;
  store_slug: string | null;
  role: string;
  email: string;
  can_accept: boolean;
  can_reject: boolean;
};

export async function fetchTeamInvitePreview(token: string): Promise<TeamInvitePreview> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ invite: TeamInvitePreview }>>(
    `/team-invites/${encodeURIComponent(token)}`,
  );
  return data.data.invite;
}

export async function acceptTeamInvite(token: string): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.post(`/team-invites/${encodeURIComponent(token)}/accept`);
}

export async function rejectTeamInvite(token: string): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.post(`/team-invites/${encodeURIComponent(token)}/reject`);
}
