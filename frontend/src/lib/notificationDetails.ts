import type { Notification } from '../types/notification.ts';
import type { TranslateFn } from './i18n/types.ts';

type DetailLine = { label: string; value: string };

export function notificationDetailLines(notification: Notification): DetailLine[] {
  const raw = notification.data.detail_lines;
  if (!Array.isArray(raw)) {
    return fallbackDetailLines(notification);
  }

  return raw
    .filter((line): line is DetailLine => {
      return (
        typeof line === 'object' &&
        line !== null &&
        'label' in line &&
        'value' in line &&
        typeof line.label === 'string' &&
        typeof line.value === 'string' &&
        line.value.trim() !== ''
      );
    })
    .slice(0, 4);
}

function fallbackDetailLines(notification: Notification): DetailLine[] {
  const data = notification.data;
  const lines: DetailLine[] = [];

  const push = (label: string, value: unknown) => {
    if (typeof value === 'string' && value.trim() !== '') {
      lines.push({ label, value });
    }
  };

  push('products', data.products);
  push('customer', data.customer_name);
  push('store', data.store_name);
  push('provider', data.provider_name);
  push('service', data.service_title);
  push('product', data.product_name);

  return lines.slice(0, 3);
}

export function detailLabel(t: TranslateFn, key: string): string {
  const mapKey = `notifications.details.${key}` as const;
  const translated = t(mapKey);
  return translated === mapKey ? key : translated;
}
