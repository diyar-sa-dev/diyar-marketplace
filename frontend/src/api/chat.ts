import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { ChatMessage, Conversation, ConversationType } from '../types/chat.ts';

export async function fetchConversations(page = 1, perPage = 20) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      conversations: Conversation[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>
  >('/profile/conversations', { params: { page, per_page: perPage } });

  return data.data;
}

export async function fetchConversation(id: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<{ conversation: Conversation }>>(
    `/profile/conversations/${id}`,
  );
  return data.data.conversation;
}

export async function createConversation(payload: {
  type: ConversationType;
  vendor_account_id?: string;
  provider_account_id?: string;
  customer_user_id?: string;
  subject?: string;
  context_type?: string;
  context_id?: string;
}) {
  const { data } = await apiClient.post<ApiSuccessResponse<{ conversation: Conversation }>>(
    '/profile/conversations',
    payload,
  );
  return data.data.conversation;
}

export async function fetchMessages(conversationId: string, cursor?: string | null, limit = 30) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ messages: ChatMessage[]; next_cursor: string | null }>
  >(`/profile/conversations/${conversationId}/messages`, {
    params: { cursor: cursor ?? undefined, limit },
  });
  return data.data;
}

export async function sendMessage(
  conversationId: string,
  payload: { body?: string; idempotency_key?: string; reply_to_message_id?: string },
  attachment?: File,
  options?: { onUploadProgress?: (percent: number) => void },
) {
  const url = `/profile/conversations/${conversationId}/messages`;

  if (!attachment) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: ChatMessage }>>(url, {
      body: payload.body ?? null,
      idempotency_key: payload.idempotency_key,
      reply_to_message_id: payload.reply_to_message_id ?? null,
    });
    return data.data.message;
  }

  const formData = new FormData();
  if (payload.body) {
    formData.append('body', payload.body);
  }
  if (payload.idempotency_key) {
    formData.append('idempotency_key', payload.idempotency_key);
  }
  if (payload.reply_to_message_id) {
    formData.append('reply_to_message_id', payload.reply_to_message_id);
  }
  formData.append('attachment', attachment);

  const { data } = await apiClient.post<ApiSuccessResponse<{ message: ChatMessage }>>(
    url,
    formData,
    {
      onUploadProgress: (event) => {
        if (!event.total) {
          return;
        }

        options?.onUploadProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    },
  );
  return data.data.message;
}

export async function markConversationRead(conversationId: string) {
  await apiClient.patch(`/profile/conversations/${conversationId}/read`);
}

export async function hideConversation(conversationId: string) {
  await apiClient.delete(`/profile/conversations/${conversationId}`);
}

export async function fetchChatUnreadCount() {
  const { data } = await apiClient.get<ApiSuccessResponse<{ unread_count: number }>>(
    '/profile/conversations/unread-count',
  );
  return data.data.unread_count;
}

export async function sendTypingState(conversationId: string, typing: boolean) {
  await apiClient.post(`/profile/conversations/${conversationId}/typing`, { typing });
}

export async function updateMessage(conversationId: string, messageId: string, body: string) {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ message: ChatMessage }>>(
    `/profile/conversations/${conversationId}/messages/${messageId}`,
    { body },
  );
  return data.data.message;
}

export async function deleteMessage(conversationId: string, messageId: string) {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ message: ChatMessage }>>(
    `/profile/conversations/${conversationId}/messages/${messageId}`,
  );
  return data.data.message;
}

export async function fetchChatReportReasons() {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ reasons: Array<{ value: string; label: string }> }>
  >('/profile/chat/report-reasons');
  return data.data.reasons;
}

export async function reportMessage(
  conversationId: string,
  messageId: string,
  payload: { reason: string; details?: string },
) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{
      report: { id: string; message_id: string; reason: string; status: string; created_at: string };
    }>
  >(`/profile/conversations/${conversationId}/messages/${messageId}/report`, payload);
  return data.data.report;
}

export async function fetchChatAttachmentBlob(path: string, inline = true) {
  const normalized = path.includes('?') ? path : `${path}${inline ? '?inline=1' : ''}`;
  const { data } = await apiClient.get(normalized, { responseType: 'blob' });
  return data;
}
