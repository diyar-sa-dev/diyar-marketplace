import { adminApi } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

type CategoryPayload = {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_active?: boolean;
  image_url?: string | null;
};

type UploadProgressHandler = (percent: number) => void;

export async function uploadAdminCategoryImage(
  categoryId: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<CategoryPayload> {
  const formData = new FormData();
  formData.append('image', file);

  await ensureCsrfCookie();

  const response = await adminApi.post<ApiSuccessResponse<{ category: CategoryPayload }>>(
      `/admin/categories/${categoryId}/image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded * 100) / event.total));
          }
        },
      },
  );

  return response.data.data.category;
}

export async function deleteAdminCategoryImage(categoryId: string): Promise<CategoryPayload> {
  await ensureCsrfCookie();

  const response = await adminApi.delete<ApiSuccessResponse<{ category: CategoryPayload }>>(
    `/admin/categories/${categoryId}/image`,
  );

  return response.data.data.category;
}
