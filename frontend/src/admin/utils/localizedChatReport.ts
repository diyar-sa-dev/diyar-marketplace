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

export function localizedChatReportReason(
  reason: string | null | undefined,
  t: TranslateFn,
): string {
  if (!reason) {
    return '—';
  }

  const key = REASON_KEYS[reason.toLowerCase()];
  return key ? t(key as never) : reason;
}

export function localizedChatReportStatus(
  status: string | null | undefined,
  t: TranslateFn,
): string {
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

export function localizedChatReportAction(
  action: string | null | undefined,
  t: TranslateFn,
): string {
  if (!action) {
    return '—';
  }

  const key = ACTION_KEYS[action.toLowerCase()];
  return key ? t(key as never) : action.replace(/_/g, ' ');
}

export function chatReportReasonBadgeClass(reason: string | null | undefined): string {
  switch ((reason ?? '').toLowerCase()) {
    case 'spam':
      return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
    case 'harassment':
    case 'hate_speech':
    case 'scam':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200';
    case 'inappropriate':
      return 'bg-rose-50 text-rose-800 ring-1 ring-rose-200';
    case 'impersonation':
      return 'bg-[#f4ead8] text-[#8a6a2f] ring-1 ring-[#e4d4b0]';
    default:
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
  }
}
