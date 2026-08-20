import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  NotificationPreferenceSettings,
  NotificationPreferenceUpdate,
} from '../types/notification.ts';

export type {
  NotificationCategoryDefinition,
  NotificationPreferenceMatrix,
  NotificationPreferenceSettings,
} from '../types/notification.ts';

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceSettings> {
  const { data } = await apiClient.get<ApiSuccessResponse<NotificationPreferenceSettings>>(
    '/profile/notification-preferences',
  );

  return data.data;
}

export async function updateNotificationPreferences(
  payload: NotificationPreferenceUpdate,
): Promise<NotificationPreferenceSettings> {
  const { data } = await apiClient.patch<
    ApiSuccessResponse<{
      channels: NotificationPreferenceSettings['channels'];
      preferences: NotificationPreferenceSettings['preferences'];
      category_enabled: NotificationPreferenceSettings['category_enabled'];
    }>
  >('/profile/notification-preferences', payload);

  return {
    channels: data.data.channels,
    categories: [],
    preferences: data.data.preferences,
    category_enabled: data.data.category_enabled,
  };
}
