import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  Notification,
  NotificationFilter,
  NotificationListResponse,
  NotificationStatusFilter,
} from '../types/notification.ts';

export type { Notification, NotificationListResponse } from '../types/notification.ts';

function statusParam(status: NotificationStatusFilter): string | undefined {
  if (status === 'unread') {
    return 'unread';
  }
  if (status === 'read') {
    return 'read';
  }
  return undefined;
}

export async function fetchNotifications(
  filter: Partial<NotificationFilter> = {},
): Promise<NotificationListResponse> {
  const page = filter.page ?? 1;
  const perPage = filter.perPage ?? 20;
  const status = filter.status ?? 'all';
  const category = filter.category;

  const { data } = await apiClient.get<ApiSuccessResponse<NotificationListResponse>>(
    '/profile/notifications',
    {
      params: {
        page,
        per_page: perPage,
        status: statusParam(status),
        category: category && category !== 'all' ? category : undefined,
      },
    },
  );
  return data.data;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ unread_count: number }>>(
    '/profile/notifications/unread-count',
  );
  return data.data.unread_count;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ notification: Notification }>>(
    `/profile/notifications/${notificationId}/read`,
  );
  return data.data.notification;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ updated_count: number }>>(
    '/profile/notifications/read-all',
  );
  return data.data.updated_count;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/profile/notifications/${notificationId}`);
}

export async function deleteAllNotifications(): Promise<number> {
  const { data } =
    await apiClient.delete<ApiSuccessResponse<{ deleted_count: number }>>('/profile/notifications');
  return data.data.deleted_count;
}
