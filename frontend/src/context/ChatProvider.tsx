import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMessages, markConversationRead } from '../api/chat.ts';
import type { ChatCrossTabPayload, MessageCreatedPayload, MessageUpdatedPayload, TypingUpdatedPayload } from '../types/chat.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { isRealtimeEnabled } from '../lib/env.ts';
import { bumpConversationPreview } from '../lib/chat/conversationListCache.ts';
import {
  flattenMessages,
  mergeIncomingMessage,
  mergeReconciledMessages,
  upsertMessageInInfiniteData,
  type MessagesInfiniteData,
} from '../lib/chat/messageCache.ts';
import { createEcho, type RealtimeConnectionState } from '../lib/realtime/echo.ts';
import { chatKeys } from '../hooks/chat/useChat.ts';

const CROSS_TAB_CHANNEL = 'diyar-chat';

type ChatContextValue = {
  connectionState: RealtimeConnectionState;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  setActiveConversationId: (id: string | null) => void;
  subscribeConversation: (conversationId: string) => void;
  unsubscribeConversation: () => void;
  reconcileActiveConversation: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function toChatMessage(payload: MessageCreatedPayload | MessageUpdatedPayload) {
  return {
    id: payload.message_id,
    conversation_id: payload.conversation_id,
    sender_id: payload.sender_id,
    sender_name: payload.sender_name,
    body: payload.body,
    message_type: payload.message_type as 'text' | 'system' | 'attachment',
    reply_to_message_id: payload.reply_to_message_id ?? null,
    edited_at: payload.edited_at ?? null,
    deleted_at: payload.deleted_at ?? null,
    is_deleted: payload.is_deleted ?? Boolean(payload.deleted_at),
    attachments: payload.attachments,
    created_at: payload.created_at,
    send_status: 'sent' as const,
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('idle');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createEcho>['private']> | null>(null);
  const subscribedIdRef = useRef<string | null>(null);
  const crossTabRef = useRef<BroadcastChannel | null>(null);
  const lastKnownMessageIdRef = useRef<Record<string, string>>({});

  const publishCrossTab = useCallback((payload: ChatCrossTabPayload) => {
    crossTabRef.current?.postMessage(payload);
  }, []);

  const mergeMessage = useCallback(
    (payload: MessageCreatedPayload, fromCrossTab = false) => {
      if (payload.sender_id === user?.id) {
        bumpConversationPreview(
          queryClient,
          payload.conversation_id,
          {
            id: payload.message_id,
            body: payload.body,
            sender_id: payload.sender_id,
            message_type: payload.message_type,
            created_at: payload.created_at,
          },
          false,
        );
        return;
      }

      const message = toChatMessage(payload);
      lastKnownMessageIdRef.current[payload.conversation_id] = payload.message_id;

      const cacheKey = chatKeys.messages(payload.conversation_id);
      const existing = queryClient.getQueryData<MessagesInfiniteData>(cacheKey);
      const isActiveThread = payload.conversation_id === subscribedIdRef.current;

      const writeMessageToCache = (snapshot: MessagesInfiniteData | undefined) => {
        queryClient.setQueryData<MessagesInfiniteData>(cacheKey, mergeIncomingMessage(snapshot, message));
      };

      if (!existing?.pages?.length && isActiveThread) {
        void fetchMessages(payload.conversation_id, null, 30)
          .then((latest) => {
            queryClient.setQueryData<MessagesInfiniteData>(cacheKey, (current) => {
              const base = current ?? queryClient.getQueryData<MessagesInfiniteData>(cacheKey);
              const reconciled = mergeReconciledMessages(base, latest.messages);
              return mergeIncomingMessage(reconciled, message);
            });
          })
          .catch(() => {
            writeMessageToCache(existing);
          });
      } else {
        writeMessageToCache(existing);
      }

      const isViewingConversation = payload.conversation_id === subscribedIdRef.current;

      if (isViewingConversation) {
        bumpConversationPreview(
          queryClient,
          payload.conversation_id,
          {
            id: message.id,
            body: message.body,
            sender_id: message.sender_id,
            message_type: message.message_type,
            created_at: message.created_at,
          },
          false,
        );
        void markConversationRead(payload.conversation_id)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
          })
          .catch(() => undefined);
      } else {
        bumpConversationPreview(
          queryClient,
          payload.conversation_id,
          {
            id: message.id,
            body: message.body,
            sender_id: message.sender_id,
            message_type: message.message_type,
            created_at: message.created_at,
          },
          true,
        );
        void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
      }

      if (!fromCrossTab) {
        publishCrossTab({ type: 'message', conversation_id: payload.conversation_id, message });
      }
    },
    [publishCrossTab, queryClient, user?.id],
  );

  const applyMessageUpdate = useCallback(
    (payload: MessageUpdatedPayload, fromCrossTab = false) => {
      const message = toChatMessage(payload);
      const cacheKey = chatKeys.messages(payload.conversation_id);
      const existing = queryClient.getQueryData<MessagesInfiniteData>(cacheKey);

      queryClient.setQueryData<MessagesInfiniteData>(cacheKey, (current) =>
        upsertMessageInInfiniteData(current ?? existing, message),
      );

      const flattened = flattenMessages(existing ?? queryClient.getQueryData<MessagesInfiniteData>(cacheKey));
      const lastMessage = flattened.at(-1);
      if (lastMessage?.id === message.id) {
        bumpConversationPreview(
          queryClient,
          payload.conversation_id,
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

      if (!fromCrossTab) {
        publishCrossTab({ type: 'message_updated', conversation_id: payload.conversation_id, message });
      }
    },
    [publishCrossTab, queryClient],
  );

  const reconcileActiveConversation = useCallback(async () => {
    const conversationId = subscribedIdRef.current;
    if (!conversationId) {
      return;
    }

    try {
      const latest = await fetchMessages(conversationId, null, 30);
      queryClient.setQueryData<MessagesInfiniteData>(
        chatKeys.messages(conversationId),
        (current) => mergeReconciledMessages(current, latest.messages),
      );

      const lastMessage = latest.messages.at(-1);
      if (lastMessage) {
        lastKnownMessageIdRef.current[conversationId] = lastMessage.id;
      }

      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
    } catch {
      // Keep last known cache on reconciliation failure.
    }
  }, [queryClient]);

  const unsubscribeConversation = useCallback(() => {
    if (subscribedIdRef.current) {
      createEcho().leave(`private-conversations.${subscribedIdRef.current}`);
      channelRef.current?.stopListening('.message.created');
      channelRef.current?.stopListening('.message.updated');
      channelRef.current?.stopListening('.typing.updated');
      channelRef.current = null;
      subscribedIdRef.current = null;
    }
  }, []);

  const subscribeConversation = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !isRealtimeEnabled()) {
        return;
      }

      if (subscribedIdRef.current === conversationId && channelRef.current) {
        return;
      }

      unsubscribeConversation();
      setActiveConversationId(conversationId);
      subscribedIdRef.current = conversationId;

      const channel = createEcho().private(`conversations.${conversationId}`);
      channel.listen('.message.created', (payload: MessageCreatedPayload) => {
        mergeMessage(payload);
      });
      channel.listen('.message.updated', (payload: MessageUpdatedPayload) => {
        applyMessageUpdate(payload);
      });
      channel.listen('.typing.updated', (payload: TypingUpdatedPayload) => {
        if (payload.user_id === user?.id) {
          return;
        }

        setTypingUsers((current) => {
          const existing = current[conversationId] ?? [];
          const withoutUser = existing.filter((name) => name !== (payload.name ?? ''));

          if (!payload.typing) {
            return { ...current, [conversationId]: withoutUser };
          }

          return {
            ...current,
            [conversationId]: payload.name ? [...withoutUser, payload.name] : withoutUser,
          };
        });
      });
      channelRef.current = channel;

      void markConversationRead(conversationId).catch(() => undefined);
    },
    [applyMessageUpdate, isAuthenticated, mergeMessage, unsubscribeConversation, user?.id],
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);
    crossTabRef.current = channel;

    channel.onmessage = (event: MessageEvent<ChatCrossTabPayload>) => {
      if (!event.data) {
        return;
      }

      if (event.data.type === 'message' && event.data.message) {
        mergeMessage(
          {
            message_id: event.data.message.id,
            conversation_id: event.data.conversation_id,
            sender_id: event.data.message.sender_id,
            sender_name: event.data.message.sender_name,
            body: event.data.message.body,
            message_type: event.data.message.message_type,
            reply_to_message_id: event.data.message.reply_to_message_id,
            edited_at: event.data.message.edited_at,
            deleted_at: event.data.message.deleted_at,
            is_deleted: event.data.message.is_deleted,
            created_at: event.data.message.created_at,
            attachments: event.data.message.attachments,
          },
          true,
        );
      }

      if (event.data.type === 'message_updated' && event.data.message) {
        applyMessageUpdate(
          {
            message_id: event.data.message.id,
            conversation_id: event.data.conversation_id,
            sender_id: event.data.message.sender_id,
            sender_name: event.data.message.sender_name,
            body: event.data.message.body,
            message_type: event.data.message.message_type,
            reply_to_message_id: event.data.message.reply_to_message_id,
            edited_at: event.data.message.edited_at,
            deleted_at: event.data.message.deleted_at,
            is_deleted: event.data.message.is_deleted,
            created_at: event.data.message.created_at,
            attachments: event.data.message.attachments,
          },
          true,
        );
      }
    };

    return () => {
      channel.close();
      crossTabRef.current = null;
    };
  }, [applyMessageUpdate, mergeMessage]);

  useEffect(() => {
    if (!isAuthenticated || !isRealtimeEnabled()) {
      setConnectionState('idle');
      unsubscribeConversation();
      return;
    }

    const echo = createEcho();
    setConnectionState('connecting');

    const connector = echo.connector.pusher.connection;
    const onConnected = () => {
      setConnectionState('connected');
      if (subscribedIdRef.current) {
        subscribeConversation(subscribedIdRef.current);
      }
      void reconcileActiveConversation();
    };
    const onDisconnected = () => setConnectionState('disconnected');
    const onFailed = () => setConnectionState('failed');

    connector.bind('connected', onConnected);
    connector.bind('disconnected', onDisconnected);
    connector.bind('failed', onFailed);
    connector.bind('unavailable', onFailed);

    if (connector.state === 'connected') {
      setConnectionState('connected');
    }

    return () => {
      connector.unbind('connected', onConnected);
      connector.unbind('disconnected', onDisconnected);
      connector.unbind('failed', onFailed);
      connector.unbind('unavailable', onFailed);
      unsubscribeConversation();
    };
  }, [isAuthenticated, reconcileActiveConversation, subscribeConversation, unsubscribeConversation]);

  const value = useMemo(
    () => ({
      connectionState,
      activeConversationId,
      typingUsers,
      setActiveConversationId,
      subscribeConversation,
      unsubscribeConversation,
      reconcileActiveConversation,
    }),
    [
      connectionState,
      activeConversationId,
      typingUsers,
      subscribeConversation,
      unsubscribeConversation,
      reconcileActiveConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatRealtime() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatRealtime must be used within ChatProvider');
  }
  return context;
}
