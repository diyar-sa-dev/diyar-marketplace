import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../api/notificationPreferences.ts';
import type {
  NotificationPreferenceSettings,
  NotificationPreferenceUpdate,
} from '../../types/notification.ts';

export const notificationPreferenceKeys = {
  all: ['notification-preferences'] as const,
};

export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: notificationPreferenceKeys.all,
    queryFn: fetchNotificationPreferences,
    enabled,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotificationPreferenceUpdate) => updateNotificationPreferences(payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: notificationPreferenceKeys.all });

      const previous = queryClient.getQueryData<NotificationPreferenceSettings>(
        notificationPreferenceKeys.all,
      );

      queryClient.setQueryData<NotificationPreferenceSettings>(
        notificationPreferenceKeys.all,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            channels: variables.channels
              ? { ...current.channels, ...variables.channels }
              : current.channels,
            category_enabled: variables.category_enabled
              ? { ...current.category_enabled, ...variables.category_enabled }
              : current.category_enabled,
            preferences: variables.preferences
              ? { ...current.preferences, ...variables.preferences }
              : current.preferences,
          };
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationPreferenceKeys.all, context.previous);
      }
    },
    onSuccess: (partial, variables) => {
      queryClient.setQueryData<NotificationPreferenceSettings>(
        notificationPreferenceKeys.all,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            channels: partial.channels ?? current.channels,
            preferences: partial.preferences ?? current.preferences,
            category_enabled: partial.category_enabled ?? current.category_enabled,
          };
        },
      );

      if (variables.channels && !variables.preferences && !variables.category_enabled) {
        void queryClient.invalidateQueries({ queryKey: notificationPreferenceKeys.all });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationPreferenceKeys.all });
    },
  });
}
