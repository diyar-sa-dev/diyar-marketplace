import type { TranslateFn } from '../../lib/i18n/types.ts';

const STATUS_KEYS: Record<string, string> = {
  active: 'admin.tables.active',
  inactive: 'admin.tables.inactive',
  pending: 'admin.tables.pending',
  suspended: 'admin.tables.suspended',
  approved: 'admin.tables.approved',
  paid: 'admin.tables.paid',
  rejected: 'admin.tables.rejected',
  cancelled: 'admin.tables.cancelled',
  processing: 'admin.status.processing',
  draft: 'admin.status.draft',
  shipped: 'admin.status.shipped',
  delivered: 'admin.status.delivered',
  completed: 'admin.status.completed',
  open: 'admin.status.open',
  closed: 'admin.status.closed',
};

export function localizedStatusLabel(status: string | null | undefined, t: TranslateFn): string {
  if (!status) {
    return '—';
  }

  const key = STATUS_KEYS[status.toLowerCase()];
  return key ? t(key as never) : status.replace(/_/g, ' ');
}
