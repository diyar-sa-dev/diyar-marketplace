import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type StoreFollowSummary = {
  followers_count: number;
  is_following: boolean;
};

type FollowResponse = ApiSuccessResponse<{ follow: StoreFollowSummary }>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

export async function followStore(slug: string): Promise<StoreFollowSummary> {
  const { data } = await withCsrf(() => apiClient.post<FollowResponse>(`/vendors/${slug}/follow`));
  return data.data.follow;
}

export async function unfollowStore(slug: string): Promise<StoreFollowSummary> {
  const { data } = await withCsrf(() =>
    apiClient.delete<FollowResponse>(`/vendors/${slug}/follow`),
  );
  return data.data.follow;
}
