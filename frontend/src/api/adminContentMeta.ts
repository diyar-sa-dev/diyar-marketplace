import { adminApi } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { BlogCategory, BlogTag } from '../types/blog.ts';

export async function createAdminBlogCategory(name: string): Promise<BlogCategory> {
  const response = await adminApi.post<ApiSuccessResponse<{ category: BlogCategory }>>(
    '/admin/blog/categories',
    { name },
  );
  return response.data.data.category;
}

export async function createAdminBlogTag(name: string): Promise<BlogTag> {
  const response = await adminApi.post<ApiSuccessResponse<{ tag: BlogTag }>>(
    '/admin/blog/tags',
    { name },
  );
  return response.data.data.tag;
}
