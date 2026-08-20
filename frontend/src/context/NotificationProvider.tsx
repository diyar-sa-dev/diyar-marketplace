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
  createEcho,
  disconnectEcho,
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
  const reconnectAttemptRef = useRef(0);
  const crossTabRef = useRef<BroadcastChannel | null>(null);

  const setUnreadCount = useCallback(
    (count: number) => {
      queryClient.setQueryData(notificationKeys.unreadCount(), count);
    },
    [queryClient],
  );

  const prependNotification = useCallback(
    (notification: Notification) => {
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
        (current) => {
          if (!current?.notifications) {
            return current;
          }

          if (current.notifications.some((item) => item.id === notification.id)) {
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
        },
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
          (current) => {
            if (!current?.notifications) {
              return current;
            }

            if (current.notifications.some((item) => item.id === notification.id)) {
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
          },
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
      disconnectEcho();
      setConnectionState('idle');
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | undefined;

    const connect = () => {
      setConnectionState('connecting');
      const echo = createEcho();
      const channel = echo.private(`users.${user.id}`);

      channel
        .listen('.notification.created', (payload: NotificationCreatedPayload) => {
          const notification = toUserNotification(payload);
          prependNotification(notification);

          if (
            payload.type === 'chat.message_received' ||
            payload.entity_type === 'conversation'
          ) {
            if (payload.entity_id) {
              bumpConversationPreview(
                queryClient,
                payload.entity_id,
                {
                  id: payload.notification_id,
                  body: payload.body,
                  sender_id: '',
                  message_type: 'text',
                  created_at: payload.created_at,
                },
                false,
              );
            }
            if (typeof payload.unread_count === 'number') {
              setUnreadCount(payload.unread_count);
            }
            void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
          }

          if (typeof payload.unread_count === 'number') {
            setUnreadCount(payload.unread_count);
          } else if (!notification.is_read) {
            void reconcile();
          }
        })
        .listen('.notification.read_state', (payload: NotificationReadStatePayload) => {
          setUnreadCount(payload.unread_count);
          publishCrossTab(payload);
          void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        });

      echo.connector.pusher.connection.bind('connected', () => {
        if (cancelled) {
          return;
        }

        reconnectAttemptRef.current = 0;
        setConnectionState('connected');
        void reconcile();
      });

      echo.connector.pusher.connection.bind('disconnected', () => {
        if (cancelled) {
          return;
        }

        setConnectionState('disconnected');
        const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      });

      echo.connector.pusher.connection.bind('error', () => {
        if (!cancelled) {
          setConnectionState('failed');
        }
      });
    };

    connect();

    const reconcileTimer = window.setInterval(() => {
      void reconcile();
    }, RECONCILE_MS);

    return () => {
      cancelled = true;
      window.clearInterval(reconcileTimer);
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      disconnectEcho();
      setConnectionState('idle');
    };
  }, [
    isAuthenticated,
    user?.id,
    prependNotification,
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
