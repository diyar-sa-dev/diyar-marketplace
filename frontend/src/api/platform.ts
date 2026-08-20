import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type ConsultationPayload = {
  name: string;
  phone: string;
  email?: string;
  message: string;
  locale?: string;
};

export async function submitConsultation(payload: ConsultationPayload): Promise<string> {
  const { data } = await apiClient.post<ApiSuccessResponse<null>>(
    '/platform/consultation',
    payload,
  );
  return data.message ?? '';
}

export async function subscribeNewsletter(email: string, locale?: string): Promise<string> {
  const { data } = await apiClient.post<ApiSuccessResponse<null>>('/platform/newsletter', {
    email,
    locale,
  });
  return data.message ?? '';
}
