import type { QueryClient } from '@tanstack/react-query';
import { chatKeys } from '../../hooks/chat/useChat.ts';

type ConversationPreview = {
  id: string;
  unread_count: number;
  last_message_at: string | null;
  last_message: {
    id: string;
    body: string | null;
    sender_id: string;
    message_type: string;
    created_at: string;
  } | null;
};

export function bumpConversationPreview(
  queryClient: QueryClient,
  conversationId: string,
  preview: {
    id: string;
    body: string | null;
    sender_id: string;
    message_type: string;
    created_at: string;
  },
  incrementUnread: boolean,
): void {
  queryClient.setQueriesData<{ conversations: ConversationPreview[] }>(
    { queryKey: chatKeys.conversations() },
    (current) => {
      if (!current?.conversations) {
        return current;
      }

      const existing = current.conversations.find(
        (conversation) => conversation.id === conversationId,
      );
      const updatedConversation: ConversationPreview = {
        ...(existing ?? {
          id: conversationId,
          unread_count: 0,
          last_message_at: null,
          last_message: null,
        }),
        last_message_at: preview.created_at,
        last_message: preview,
        unread_count: incrementUnread ? (existing?.unread_count ?? 0) + 1 : 0,
      };

      const remaining = current.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      return {
        ...current,
        conversations: [updatedConversation, ...remaining],
      };
    },
  );
}
