import { apiClient } from './client.ts';
import { isApiErrorDetail } from '../utils/errors.ts';
import type { VisualSearchResponse } from '../types/visualSearch.ts';

const MAX_BYTES = 2 * 1024 * 1024;

export type VisualSearchErrorKey =
  | 'invalid_type'
  | 'file_too_large'
  | 'dimensions_exceeded'
  | 'pixel_count_exceeded'
  | 'invalid_dimensions'
  | 'request_failed';

export function resolveVisualSearchErrorKey(error: unknown): VisualSearchErrorKey {
  if (!isApiErrorDetail(error)) {
    return 'request_failed';
  }

  const imageErrors = error.errors?.image;
  if (!Array.isArray(imageErrors) || imageErrors.length === 0) {
    return 'request_failed';
  }

  const haystack = imageErrors.join(' ').toLowerCase();

  if (haystack.includes('2 mb') || haystack.includes('2mb') || haystack.includes('2 ميج')) {
    return 'file_too_large';
  }

  if (haystack.includes('dimension') || haystack.includes('أبعاد')) {
    return 'dimensions_exceeded';
  }

  if (haystack.includes('pixel') || haystack.includes('بكسل')) {
    return 'pixel_count_exceeded';
  }

  if (haystack.includes('type') || haystack.includes('extension') || haystack.includes('نوع')) {
    return 'invalid_type';
  }

  return 'request_failed';
}

export function validateVisualSearchFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return 'invalid_type';
  }

  if (file.size > MAX_BYTES) {
    return 'file_too_large';
  }

  return null;
}

export async function postVisualSearch(
  file: File,
  page = 1,
  perPage = 20,
): Promise<VisualSearchResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('page', String(page));
  formData.append('per_page', String(perPage));

  const response = await apiClient.post<VisualSearchResponse>('/search/visual', formData);
  return response.data;
}
