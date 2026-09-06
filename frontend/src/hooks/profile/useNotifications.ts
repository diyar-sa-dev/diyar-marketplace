import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications.ts';
import type { NotificationFilter, NotificationStatusFilter } from '../../types/notification.ts';

import { marketplaceQueryKey } from '../../lib/auth/queryKeys.ts';
import { usePageVisibility } from '../usePageVisibility.ts';

export const notificationKeys = {
  all: marketplaceQueryKey('notifications'),
  list: (page: number, status: NotificationStatusFilter, category: string | null, perPage = 20) =>
    [...notificationKeys.all, 'list', page, status, category ?? 'all', perPage] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

const RECONCILE_MS = 120_000;
const RECONCILE_HIDDEN_MS = 300_000;
export const LIST_STALE_MS = 20_000;
const UNREAD_STALE_MS = 10_000;

export async function reconcileNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  try {
    const unreadCount = await fetchUnreadNotificationCount();
    queryClient.setQueryData(notificationKeys.unreadCount(), unreadCount);
    await queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === notificationKeys.all[0] &&
        query.queryKey[1] === 'list',
    });
  } catch {
    // Keep last known state when reconciliation fails.
  }
}

export function useReconcileNotifications() {
  const queryClient = useQueryClient();

  return () => reconcileNotifications(queryClient);
}

export function useNotifications(filter: Partial<NotificationFilter> = {}) {
  const page = filter.page ?? 1;
  const status = filter.status ?? 'all';
  const category = filter.category ?? null;
  const perPage = filter.perPage ?? 20;

  return useQuery({
    queryKey: notificationKeys.list(page, status, category, perPage),
    queryFn: () => fetchNotifications({ page, perPage, status, category }),
    staleTime: LIST_STALE_MS,
    placeholderData: (previousData, previousQuery) => {
      const previousPerPage = previousQuery?.queryKey[5];
      if (previousPerPage !== undefined && previousPerPage !== perPage) {
        return undefined;
      }

      return previousData;
    },
  });
}

export function useUnreadNotificationCount(enabled = true) {
  const pageVisible = usePageVisibility();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    enabled,
    staleTime: UNREAD_STALE_MS,
    refetchInterval: pageVisible ? RECONCILE_MS : RECONCILE_HIDDEN_MS,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.all });
      let wasUnread = false;

      queryClient.setQueriesData<Awaited<ReturnType<typeof fetchNotifications>>>(
        { queryKey: notificationKeys.all },
        (current) => {
          if (!current?.notifications) {
            return current;
          }

          return {
            ...current,
            notifications: current.notifications.map((item) => {
              if (item.id !== notificationId) {
                return item;
              }
              if (!item.is_read) {
                wasUnread = true;
              }
              return { ...item, is_read: true, read_at: new Date().toISOString() };
            }),
          };
        },
      );

      if (wasUnread) {
        queryClient.setQueryData<number>(notificationKeys.unreadCount(), (count = 0) =>
          Math.max(0, count - 1),
        );
      }

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.all });
      const previousCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());

      queryClient.setQueriesData<Awaited<ReturnType<typeof fetchNotifications>>>(
        { queryKey: notificationKeys.all },
        (current) => {
          if (!current?.notifications) {
            return current;
          }

          return {
            ...current,
            notifications: current.notifications.map((item) => ({
              ...item,
              is_read: true,
              read_at: item.read_at ?? new Date().toISOString(),
            })),
          };
        },
      );
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);

      return { previousLists, previousCount };
    },
    onError: (_error, _vars, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(notificationKeys.unreadCount(), context?.previousCount ?? 0);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.all });
      let wasUnread = false;

      queryClient.setQueriesData<Awaited<ReturnType<typeof fetchNotifications>>>(
        { queryKey: notificationKeys.all },
        (current) => {
          if (!current?.notifications) {
            return current;
          }

          const target = current.notifications.find((item) => item.id === notificationId);
          wasUnread = target?.is_read === false;

          return {
            ...current,
            notifications: current.notifications.filter((item) => item.id !== notificationId),
            pagination: {
              ...current.pagination,
              total: Math.max(0, current.pagination.total - 1),
            },
          };
        },
      );

      if (wasUnread) {
        queryClient.setQueryData<number>(notificationKeys.unreadCount(), (count = 0) =>
          Math.max(0, count - 1),
        );
      }

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.all });
      const previousCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());

      queryClient.setQueriesData({ queryKey: notificationKeys.all }, (current) => {
        if (!current || typeof current !== 'object' || !('notifications' in current)) {
          return current;
        }

        return {
          ...(current as Awaited<ReturnType<typeof fetchNotifications>>),
          notifications: [],
          pagination: {
            ...(current as Awaited<ReturnType<typeof fetchNotifications>>).pagination,
            total: 0,
            last_page: 1,
            current_page: 1,
          },
        };
      });
      queryClient.setQueryData(notificationKeys.unreadCount(), 0);

      return { previousLists, previousCount };
    },
    onError: (_error, _vars, context) => {
      context?.previousLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      queryClient.setQueryData(notificationKeys.unreadCount(), context?.previousCount ?? 0);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
