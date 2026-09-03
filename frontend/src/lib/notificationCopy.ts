import type { Notification } from '../types/notification.ts';
import type { Locale, TranslateFn, TranslateParams } from './i18n/types.ts';

const BRACE_PLACEHOLDER_RE = /\{\{[a-z0-9_]+\}\}/i;
const LARAVEL_PLACEHOLDER_RE = /:[a-z][a-z0-9_]*/i;
const ANY_PLACEHOLDER_RE = /\{\{[a-z0-9_]+\}\}|:[a-z][a-z0-9_]*/gi;

const FIELD_ALIASES: Record<string, string[]> = {
  service_title: ['service_title', 'service_title_snapshot', 'service', 'service_name'],
  booking_reference: ['booking_reference'],
  product_name: ['product_name', 'product'],
  provider_name: ['provider_name', 'provider'],
  customer_name: ['customer_name', 'customer'],
  store_name: ['store_name', 'store'],
  reviewer_name: ['reviewer_name', 'reviewer'],
  sender_name: ['sender_name', 'sender'],
  vendor_name: ['vendor_name', 'store_name', 'store'],
  status: ['status', 'status_label'],
  role: ['role', 'role_label'],
  action_label: ['action_taken', 'action_label'],
  reason_label: ['reason', 'reason_label'],
};

const LOCALIZED_FIELDS = new Set([
  'status',
  'role',
  'action_label',
  'action_taken',
  'reason_label',
  'reason',
]);

function notificationEventKey(type: string): string {
  return type.replace(/\./g, '_');
}

function translatedLabel(t: TranslateFn, key: string, fallback: string): string {
  const label = t(key);

  return label !== key ? label : fallback;
}

function flattenNotificationData(data: Record<string, unknown>): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.trim() !== '') {
      flat[key] = value.trim();
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      flat[key] = String(value);
    }
  }

  const lines = data.detail_lines;
  if (Array.isArray(lines)) {
    for (const line of lines) {
      if (
        typeof line !== 'object' ||
        line === null ||
        !('label' in line) ||
        !('value' in line)
      ) {
        continue;
      }

      const label = typeof line.label === 'string' ? line.label.trim() : '';
      const value = typeof line.value === 'string' ? line.value.trim() : '';
      if (label !== '' && value !== '' && flat[label] === undefined) {
        flat[label] = value;
      }
    }
  }

  return flat;
}

function resolveAliasedValue(flat: Record<string, string>, field: string): string | undefined {
  const aliases = FIELD_ALIASES[field] ?? [field];
  for (const alias of aliases) {
    const value = flat[alias];
    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}

function localizeEnumValue(type: string, field: string, value: string, t: TranslateFn): string {
  const eventKey = notificationEventKey(type);
  const eventSpecific = translatedLabel(
    t,
    `notifications.events.${eventKey}.${field}.${value}`,
    '',
  );
  if (eventSpecific !== '') {
    return eventSpecific;
  }

  if (field === 'status') {
    for (const catalog of ['returns.status', 'bookings.status']) {
      const label = translatedLabel(t, `${catalog}.${value}`, '');
      if (label !== '') {
        return label;
      }
    }
  }

  if (field === 'role') {
    for (const catalog of ['vendor.team.roles', 'dashboard.vendor.team.roles']) {
      const label = translatedLabel(t, `${catalog}.${value}`, '');
      if (label !== '') {
        return label;
      }
    }
  }

  if (field === 'action_label' || field === 'action_taken') {
    const label = translatedLabel(
      t,
      `notifications.events.chat_moderation_action_taken.actions.${value}`,
      '',
    );
    if (label !== '') {
      return label;
    }
  }

  if (field === 'reason_label' || field === 'reason') {
    const label = translatedLabel(t, `notifications.events.chat_report_reasons.${value}`, '');
    if (label !== '') {
      return label;
    }
  }

  return value.replaceAll('_', ' ');
}

function buildNotificationParams(
  notification: Notification,
  t: TranslateFn,
  locale: Locale,
): TranslateParams {
  const flat = flattenNotificationData(notification.data ?? {});
  const params: TranslateParams = {};

  for (const [key, value] of Object.entries(flat)) {
    params[key] = LOCALIZED_FIELDS.has(key)
      ? localizeEnumValue(notification.type, key, value, t)
      : value;
  }

  for (const field of Object.keys(FIELD_ALIASES)) {
    const raw = resolveAliasedValue(flat, field);
    if (raw === undefined) {
      continue;
    }

    params[field] = LOCALIZED_FIELDS.has(field)
      ? localizeEnumValue(notification.type, field, raw, t)
      : raw;
  }

  if (params.status === undefined && typeof params.status_label === 'string') {
    params.status = params.status_label;
  }

  const products = typeof notification.data?.products === 'string' ? notification.data.products.trim() : '';
  params.products_line =
    products !== '' ? (locale === 'ar' ? ` المنتجات: ${products}.` : ` Items: ${products}.`) : '';
  params.note_line = typeof params.note_line === 'string' ? params.note_line : '';

  return params;
}

function hasUnresolvedPlaceholder(value: string): boolean {
  return BRACE_PLACEHOLDER_RE.test(value) || LARAVEL_PLACEHOLDER_RE.test(value);
}

function preferFilledCopy(localized: string, stored: string): string {
  if (!hasUnresolvedPlaceholder(localized)) {
    return localized;
  }

  if (stored.trim() !== '' && !hasUnresolvedPlaceholder(stored)) {
    return stored;
  }

  return localized.replace(ANY_PLACEHOLDER_RE, '—');
}

export function resolveNotificationCopy(
  notification: Notification,
  t: TranslateFn,
  locale: Locale,
): { title: string; body: string } {
  const key = notificationEventKey(notification.type);
  const titleKey = `notifications.events.${key}.title`;
  const bodyKey = `notifications.events.${key}.body`;
  const params = buildNotificationParams(notification, t, locale);

  const localizedTitle = t(titleKey, params);
  const localizedBody = t(bodyKey, params);

  const title = localizedTitle !== titleKey ? localizedTitle : notification.title;
  const body = localizedBody !== bodyKey ? localizedBody : notification.body;

  return {
    title: preferFilledCopy(title, notification.title),
    body: preferFilledCopy(body, notification.body),
  };
}
