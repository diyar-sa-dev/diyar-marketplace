import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendAssistantChat(payload: {
  messages: AssistantChatMessage[];
  catalog_context?: string;
  locale?: 'ar' | 'en';
}): Promise<string> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ reply: string }>>(
    '/assistant/chat',
    payload,
  );
  return data.data.reply;
}
