import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { CheckoutPreview, CheckoutPreviewPayload } from '../types/checkout.ts';

export async function fetchCheckoutPreview(payload: CheckoutPreviewPayload): Promise<CheckoutPreview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ preview: CheckoutPreview }>>(
    '/checkout/preview',
    payload,
  );
  return data.data.preview;
}
