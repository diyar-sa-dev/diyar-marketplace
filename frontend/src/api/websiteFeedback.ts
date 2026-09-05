import { marketplaceApi } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { WebsiteFeedbackType } from '../lib/websiteFeedbackStorage.ts';

export type WebsiteFeedbackRecord = {
  id: string;
  rating: number;
  type: WebsiteFeedbackType;
  message: string;
  locale?: string | null;
  created_at?: string;
  user?: { id: string; name?: string; email?: string | null } | null;
};

export async function submitWebsiteFeedback(payload: {
  rating: number;
  type: WebsiteFeedbackType;
  message: string;
  guest_key?: string;
}): Promise<WebsiteFeedbackRecord> {
  const response = await marketplaceApi.post<ApiSuccessResponse<{ feedback: WebsiteFeedbackRecord }>>(
    '/feedback',
    payload,
  );
  return response.data.data.feedback;
}

export async function fetchWebsiteFeedbackStatus(guestKey?: string): Promise<boolean> {
  const response = await marketplaceApi.get<ApiSuccessResponse<{ submitted: boolean }>>(
    '/feedback/status',
    { params: guestKey ? { guest_key: guestKey } : undefined },
  );
  return Boolean(response.data.data.submitted);
}
