import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createConversation,
  deleteMessage,
  fetchChatUnreadCount,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  hideConversation,
  markConversationRead,
  sendMessage,
  sendTypingState,
  updateMessage,
} from '../../api/chat.ts';
import type { ChatMessage, ConversationType } from '../../types/chat.ts';
import { bumpConversationPreview } from '../../lib/chat/conversationListCache.ts';
import {
  flattenMessages,
  mergeIncomingMessage,
  markMessageFailed,
  replaceOptimisticMessage,
  upsertMessageInInfiniteData,
  type MessagesInfiniteData,
} from '../../lib/chat/messageCache.ts';
import { useAuth } from '../auth/useAuth.ts';

const CROSS_TAB_CHANNEL = 'diyar-chat';

function publishMessageUpdateCrossTab(conversationId: string, message: ChatMessage) {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  new BroadcastChannel(CROSS_TAB_CHANNEL).postMessage({
    type: 'message_updated',
    conversation_id: conversationId,
    message,
  });
}

function bumpPreviewIfLastMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: ChatMessage,
) {
  const existing = queryClient.getQueryData<MessagesInfiniteData>(
    chatKeys.messages(conversationId),
  );
  const lastMessage = flattenMessages(existing).at(-1);
  if (lastMessage?.id !== message.id) {
    return;
  }

  bumpConversationPreview(
    queryClient,
    conversationId,
    {
      id: message.id,
      body: message.body,
      sender_id: message.sender_id,
      message_type: message.message_type,
      created_at: message.created_at,
    },
    false,
  );
}

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  unreadCount: () => [...chatKeys.all, 'unread-count'] as const,
};

export function useConversations(page = 1, perPage = 20) {
  return useQuery({
    queryKey: [...chatKeys.conversations(), page, perPage],
    queryFn: () => fetchConversations(page, perPage),
    staleTime: 15_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? 'none'),
    queryFn: () => fetchConversation(id!),
    enabled: Boolean(id),
  });
}

export function useMessagesInfinite(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? Boolean(conversationId);

  return useInfiniteQuery<
    { messages: ChatMessage[]; next_cursor: string | null },
    Error,
    MessagesInfiniteData,
    ReturnType<typeof chatKeys.messages>,
    string | null
  >({
    queryKey: chatKeys.messages(conversationId ?? 'none'),
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: enabled && Boolean(conversationId),
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
}

export function useChatUnreadCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: fetchChatUnreadCount,
    staleTime: 60_000,
    refetchInterval: 120_000,
    enabled: isAuthenticated,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: {
      body: string;
      idempotency_key: string;
      reply_to_message_id?: string;
      attachment?: File;
      onUploadProgress?: (percent: number) => void;
    }) =>
      sendMessage(
        conversationId,
        {
          body: payload.body,
          idempotency_key: payload.idempotency_key,
          reply_to_message_id: payload.reply_to_message_id,
        },
        payload.attachment,
        { onUploadProgress: payload.onUploadProgress },
      ),
    onMutate: async (payload) => {
      if (conversationId === 'none') {
        return { previous: undefined, clientMessageId: payload.idempotency_key };
      }

      await queryClient.cancelQueries({ queryKey: chatKeys.messages(conversationId) });

      const previous = queryClient.getQueryData<MessagesInfiniteData>(
        chatKeys.messages(conversationId),
      );

      if (!previous?.pages?.length) {
        return { previous, clientMessageId: payload.idempotency_key, skipOptimistic: true };
      }

      const lastMessage = flattenMessages(previous).at(-1);
      const optimisticCreatedAt =
        lastMessage && new Date(lastMessage.created_at).getTime() >= Date.now()
          ? new Date(new Date(lastMessage.created_at).getTime() + 1).toISOString()
          : new Date().toISOString();

      const optimistic: ChatMessage = {
        id: payload.idempotency_key,
        client_message_id: payload.idempotency_key,
        idempotency_key: payload.idempotency_key,
        send_status: 'pending',
        conversation_id: conversationId,
        sender_id: user?.id ?? '',
        sender_name: user?.name ?? null,
        body: payload.body,
        message_type: payload.attachment ? 'attachment' : 'text',
        reply_to_message_id: payload.reply_to_message_id ?? null,
        attachments: [],
        created_at: optimisticCreatedAt,
      };

      queryClient.setQueryData<MessagesInfiniteData>(
        chatKeys.messages(conversationId),
        mergeIncomingMessage(previous, optimistic),
      );

      return { previous, clientMessageId: payload.idempotency_key };
    },
    onSuccess: (message, _payload, context) => {
      const clientMessageId = context?.clientMessageId ?? message.idempotency_key ?? message.id;
      const normalizedMessage = {
        ...message,
        client_message_id: clientMessageId,
        send_status: 'sent' as const,
      };

      const existing = queryClient.getQueryData<MessagesInfiniteData>(
        chatKeys.messages(conversationId),
      );

      if (context?.skipOptimistic) {
        queryClient.setQueryData<MessagesInfiniteData>(
          chatKeys.messages(conversationId),
          mergeIncomingMessage(existing, normalizedMessage),
        );
      } else {
        queryClient.setQueryData<MessagesInfiniteData>(
          chatKeys.messages(conversationId),
          (current) => replaceOptimisticMessage(current, clientMessageId, normalizedMessage),
        );
      }

      bumpConversationPreview(
        queryClient,
        conversationId,
        {
          id: message.id,
          body: message.body,
          sender_id: message.sender_id,
          message_type: message.message_type,
          created_at: message.created_at,
        },
        false,
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(chatKeys.messages(conversationId), context.previous);
      } else if (context?.clientMessageId) {
        queryClient.setQueryData<MessagesInfiniteData>(
          chatKeys.messages(conversationId),
          (current) => markMessageFailed(current, context.clientMessageId),
        );
      }
    },
  });
}

export function useUpdateMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { messageId: string; body: string }) =>
      updateMessage(conversationId, payload.messageId, payload.body),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagesInfiniteData>(chatKeys.messages(conversationId), (current) =>
        upsertMessageInInfiniteData(current, message),
      );
      bumpPreviewIfLastMessage(queryClient, conversationId, message);
      publishMessageUpdateCrossTab(conversationId, message);
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(conversationId, messageId),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagesInfiniteData>(chatKeys.messages(conversationId), (current) =>
        upsertMessageInInfiniteData(current, message),
      );
      bumpPreviewIfLastMessage(queryClient, conversationId, message);
      publishMessageUpdateCrossTab(conversationId, message);
    },
  });
}

export function useHideConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hideConversation,
    onSuccess: (_data, conversationId) => {
      queryClient.setQueriesData<{ conversations: Array<{ id: string }> }>(
        { queryKey: chatKeys.conversations() },
        (current) => {
          if (!current?.conversations) {
            return current;
          }

          return {
            ...current,
            conversations: current.conversations.filter(
              (conversation) => conversation.id !== conversationId,
            ),
          };
        },
      );
      queryClient.removeQueries({ queryKey: chatKeys.messages(conversationId) });
      queryClient.removeQueries({ queryKey: chatKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: (_data, conversationId) => {
      queryClient.setQueriesData<{ conversations: Array<{ id: string; unread_count: number }> }>(
        { queryKey: chatKeys.conversations() },
        (current) => {
          if (!current?.conversations) {
            return current;
          }

          return {
            ...current,
            conversations: current.conversations.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, unread_count: 0 }
                : conversation,
            ),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    },
  });
}

export function useSendTyping(conversationId: string) {
  return useMutation({
    mutationFn: (typing: boolean) => sendTypingState(conversationId, typing),
  });
}

export type { ConversationType };
