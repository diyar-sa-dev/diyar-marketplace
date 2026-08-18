export type NotificationChannelSettings = {
  email: boolean;
  push: boolean;
  sms: boolean;
  orders: boolean;
  promotions: boolean;
  system: boolean;
};

const DEFAULTS: NotificationChannelSettings = {
  email: true,
  push: true,
  sms: false,
  orders: true,
  promotions: false,
  system: true,
};

export function readNotificationPreferences(
  preferences: Record<string, unknown> | undefined,
): NotificationChannelSettings {
  const stored = preferences?.notifications;

  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return { ...DEFAULTS };
  }

  const notifications = stored as Record<string, unknown>;

  return {
    email: notifications.email !== false,
    push: notifications.push !== false,
    sms: notifications.sms === true,
    orders: notifications.orders !== false,
    promotions: notifications.promotions === true,
    system: notifications.system !== false,
  };
}

export function mergeNotificationPreferences(
  preferences: Record<string, unknown> | undefined,
  patch: Partial<NotificationChannelSettings>,
): Record<string, unknown> {
  const current = readNotificationPreferences(preferences);

  return {
    ...(preferences ?? {}),
    notifications: {
      ...current,
      ...patch,
    },
  };
}
