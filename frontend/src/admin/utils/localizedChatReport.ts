import type { TranslateFn } from '../../lib/i18n/types.ts';

const REASON_KEYS: Record<string, string> = {
  spam: 'admin.chat.reasons.spam',
  harassment: 'admin.chat.reasons.harassment',
  inappropriate: 'admin.chat.reasons.inappropriate',
  scam: 'admin.chat.reasons.scam',
  hate_speech: 'admin.chat.reasons.hate_speech',
  impersonation: 'admin.chat.reasons.impersonation',
  other: 'admin.chat.reasons.other',
};

const STATUS_KEYS: Record<string, string> = {
  pending: 'admin.chat.statuses.pending',
  under_review: 'admin.chat.statuses.underReview',
  dismissed: 'admin.chat.statuses.dismissed',
  actioned: 'admin.chat.statuses.actioned',
  resolved: 'admin.chat.statuses.resolved',
};

export function localizedChatReportReason(reason: string | null | undefined, t: TranslateFn): string {
  if (!reason) {
    return '—';
  }

  const key = REASON_KEYS[reason.toLowerCase()];
  return key ? t(key as never) : reason;
}

export function localizedChatReportStatus(status: string | null | undefined, t: TranslateFn): string {
  if (!status) {
    return '—';
  }

  const key = STATUS_KEYS[status.toLowerCase()];
  return key ? t(key as never) : status.replace(/_/g, ' ');
}

const ACTION_KEYS: Record<string, string> = {
  none: 'admin.chat.actions.types.none',
  closed: 'admin.chat.actions.types.closed',
  delete_message: 'admin.chat.actions.types.delete_message',
  warn_sender: 'admin.chat.actions.types.warn_sender',
  suspend_account: 'admin.chat.actions.types.suspend_account',
  escalate: 'admin.chat.actions.types.suspend_account',
  moderated: 'admin.chat.actions.types.moderated',
};

export function localizedChatReportAction(action: string | null | undefined, t: TranslateFn): string {
  if (!action) {
    return '—';
  }

  const key = ACTION_KEYS[action.toLowerCase()];
  return key ? t(key as never) : action.replace(/_/g, ' ');
}
