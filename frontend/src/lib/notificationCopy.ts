import type { Notification } from '../types/notification.ts';
import type { Locale, TranslateFn, TranslateParams } from './i18n/types.ts';

function notificationEventKey(type: string): string {
  return type.replace(/\./g, '_');
}

function buildNotificationParams(notification: Notification, locale: Locale): TranslateParams {
  const data = notification.data ?? {};
  const params: TranslateParams = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number') {
      params[key] = value;
    }
  }

  const products = typeof data.products === 'string' ? data.products.trim() : '';
  params.products_line =
    products !== '' ? (locale === 'ar' ? ` المنتجات: ${products}.` : ` Items: ${products}.`) : '';

  return params;
}

export function resolveNotificationCopy(
  notification: Notification,
  t: TranslateFn,
  locale: Locale,
): { title: string; body: string } {
  const key = notificationEventKey(notification.type);
  const titleKey = `notifications.events.${key}.title`;
  const bodyKey = `notifications.events.${key}.body`;
  const params = buildNotificationParams(notification, locale);

  const localizedTitle = t(titleKey, params);
  const localizedBody = t(bodyKey, params);

  return {
    title: localizedTitle !== titleKey ? localizedTitle : notification.title,
    body: localizedBody !== bodyKey ? localizedBody : notification.body,
  };
}
