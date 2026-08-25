import { adminApi } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type CmsImageContext =
  | 'blog_hero'
  | 'blog_avatar'
  | 'project_cover'
  | 'project_gallery';

type CmsImageUploadData = { path: string; url: string };

export async function uploadCmsImage(
  file: File,
  context: CmsImageContext,
): Promise<CmsImageUploadData> {
  await ensureCsrfCookie();

  const formData = new FormData();
  formData.append('image', file);
  formData.append('context', context);

  const response = await adminApi.post<ApiSuccessResponse<CmsImageUploadData>>(
    '/admin/cms/media/image',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return response.data.data;
}
