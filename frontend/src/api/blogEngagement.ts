import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export async function toggleBlogArticleWishlist(slug: string): Promise<{ saved: boolean }> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ saved: boolean }>>(
    `/blog/articles/${slug}/wishlist`,
  );
  return data.data;
}
