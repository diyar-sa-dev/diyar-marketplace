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
  published: 'admin.status.published',
  archived: 'admin.status.archived',
  verified: 'admin.b2b.verification.verified',
  shipped: 'admin.status.shipped',
  delivered: 'admin.status.delivered',
  completed: 'admin.status.completed',
  failed: 'admin.status.failed',
  expired: 'admin.status.expired',
  refunded: 'admin.status.refunded',
  partially_refunded: 'admin.status.partiallyRefunded',
  refunding: 'admin.status.refunding',
  authorized: 'admin.status.authorized',
  requires_action: 'admin.status.requiresAction',
  unknown: 'admin.status.unknown',
  open: 'admin.status.open',
  closed: 'admin.status.closed',
  under_review: 'admin.chat.statuses.underReview',
  dismissed: 'admin.chat.statuses.dismissed',
  actioned: 'admin.chat.statuses.actioned',
  resolved: 'admin.chat.statuses.resolved',
};

export function localizedStatusLabel(status: string | null | undefined, t: TranslateFn): string {
  if (!status) {
    return '—';
  }

  const key = STATUS_KEYS[status.toLowerCase()];
  return key ? t(key as never) : status.replace(/_/g, ' ');
}
