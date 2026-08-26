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
import type { Notification } from '../types/notification.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { isRealtimeEnabled } from '../lib/env.ts';
import {
  RealtimeEventRouter,
  subscribeRealtimeConnection,
  prepareRealtimeConnection,
  type RealtimeConnectionState,
} from '../lib/realtime/echo.ts';
import { notificationKeys, reconcileNotifications } from '../hooks/profile/useNotifications.ts';
import { chatKeys } from '../hooks/chat/useChat.ts';
import { bumpConversationPreview } from '../lib/chat/conversationListCache.ts';

const RECONCILE_MS = 120_000;
const CROSS_TAB_CHANNEL = 'diyar-notifications';

type NotificationCreatedPayload = {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  is_read: boolean;
  unread_count?: number;
};

type NotificationReadStatePayload = {
  unread_count: number;
  action: string;
  notification_id?: string | null;
};

type NotificationContextValue = {
  connectionState: RealtimeConnectionState;
  reconcile: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function toUserNotification(payload: NotificationCreatedPayload): Notification {
  return {
    id: payload.notification_id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    priority: 'normal',
    read_at: payload.is_read ? payload.created_at : null,
    is_read: payload.is_read,
    created_at: payload.created_at,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>('idle');
  const crossTabRef = useRef<BroadcastChannel | null>(null);
  const previousConnectionRef = useRef<RealtimeConnectionState>('idle');

  const setUnreadCount = useCallback(
    (count: number) => {
      queryClient.setQueryData(notificationKeys.unreadCount(), count);
    },
    [queryClient],
  );

  const upsertNotification = useCallback(
    (notification: Notification) => {
      const applyToList = (
        current: {
          notifications: Notification[];
          pagination: { total: number; current_page: number; last_page: number; per_page: number };
        } | undefined,
        prependIfNew: boolean,
      ) => {
        if (!current?.notifications) {
          return current;
        }

        const existingIndex = current.notifications.findIndex((item) => item.id === notification.id);
        if (existingIndex >= 0) {
          const notifications = [...current.notifications];
          notifications[existingIndex] = { ...notifications[existingIndex], ...notification };

          return { ...current, notifications };
        }

        if (!prependIfNew) {
          return current;
        }

        return {
          ...current,
          notifications: [notification, ...current.notifications].slice(0, current.pagination.per_page),
          pagination: {
            ...current.pagination,
            total: current.pagination.total + 1,
          },
        };
      };

      queryClient.setQueriesData<{
        notifications: Notification[];
        pagination: { total: number; current_page: number; last_page: number; per_page: number };
      }>(
        {
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === notificationKeys.all[0] &&
            query.queryKey[1] === 'list' &&
            query.queryKey[2] === 1 &&
            query.queryKey[3] === 'all' &&
            (query.queryKey[4] === null || query.queryKey[4] === 'all'),
        },
        (current) => applyToList(current, true),
      );

      if (!notification.is_read) {
        queryClient.setQueriesData<{
          notifications: Notification[];
          pagination: { total: number; current_page: number; last_page: number; per_page: number };
        }>(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === notificationKeys.all[0] &&
              query.queryKey[1] === 'list' &&
              query.queryKey[2] === 1 &&
              query.queryKey[3] === 'unread',
          },
          (current) => applyToList(current, true),
        );
      }
    },
    [queryClient],
  );

  const reconcile = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    await reconcileNotifications(queryClient);
  }, [isAuthenticated, queryClient]);

  const publishCrossTab = useCallback((payload: NotificationReadStatePayload) => {
    crossTabRef.current?.postMessage(payload);
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(CROSS_TAB_CHANNEL);
    crossTabRef.current = channel;

    channel.onmessage = (event: MessageEvent<NotificationReadStatePayload>) => {
      if (!event.data || typeof event.data.unread_count !== 'number') {
        return;
      }

      setUnreadCount(event.data.unread_count);
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    return () => {
      channel.close();
      crossTabRef.current = null;
    };
  }, [queryClient, setUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isRealtimeEnabled()) {
      setConnectionState('idle');
      return;
    }

    let cancelled = false;
    let releaseConnection: (() => void) | null = null;
    let unsubscribeState: (() => void) | null = null;
    let reconcileTimer: number | undefined;
    const unsubs: Array<() => void> = [];

    void prepareRealtimeConnection().then(() => {
      if (cancelled) {
        return;
      }

      releaseConnection = RealtimeEventRouter.retain();
      unsubscribeState = subscribeRealtimeConnection((state) => {
        if (cancelled) {
          return;
        }

        const previous = previousConnectionRef.current;
        previousConnectionRef.current = state;
        setConnectionState(state);

        if (
          state === 'connected' &&
          (previous === 'disconnected' || previous === 'reconnecting' || previous === 'failed')
        ) {
          void reconcile();
        }
      });

      unsubs.push(
        RealtimeEventRouter.subscribePrivateChannel(
          `users.${user.id}`,
          '.notification.created',
          (payload) => {
            const notificationPayload = payload as NotificationCreatedPayload;
            const notification = toUserNotification(notificationPayload);
            upsertNotification(notification);

            if (
              notificationPayload.type === 'chat.message_received' ||
              notificationPayload.entity_type === 'conversation'
            ) {
              if (notificationPayload.entity_id) {
                bumpConversationPreview(
                  queryClient,
                  notificationPayload.entity_id,
                  {
                    id: notificationPayload.notification_id,
                    body: notificationPayload.body,
                    sender_id: '',
                    message_type: 'text',
                    created_at: notificationPayload.created_at,
                  },
                  false,
                );
              }
              if (typeof notificationPayload.unread_count === 'number') {
                setUnreadCount(notificationPayload.unread_count);
              }
              void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
            }

            if (typeof notificationPayload.unread_count === 'number') {
              setUnreadCount(notificationPayload.unread_count);
            } else if (!notification.is_read) {
              void reconcile();
            }
          },
        ),
        RealtimeEventRouter.subscribePrivateChannel(
          `users.${user.id}`,
          '.notification.read_state',
          (payload) => {
            const readPayload = payload as NotificationReadStatePayload;
            setUnreadCount(readPayload.unread_count);
            publishCrossTab(readPayload);
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          },
        ),
      );

      reconcileTimer = window.setInterval(() => {
        void reconcile();
      }, RECONCILE_MS);
    });

    return () => {
      cancelled = true;
      window.clearInterval(reconcileTimer);
      unsubs.forEach((unsub) => unsub());
      unsubscribeState?.();
      releaseConnection?.();
      setConnectionState('idle');
    };
  }, [
    isAuthenticated,
    user?.id,
    upsertNotification,
    publishCrossTab,
    queryClient,
    reconcile,
    setUnreadCount,
  ]);

  const value = useMemo(
    () => ({
      connectionState,
      reconcile,
    }),
    [connectionState, reconcile],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotificationRealtime(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationRealtime must be used within NotificationProvider');
  }

  return context;
}
