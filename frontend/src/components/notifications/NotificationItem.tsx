import { Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Notification } from '../../types/notification.ts';
import { formatRelativeReviewDate } from '../../lib/formatRelativeReviewDate.ts';
import { resolveNotificationCopy } from '../../lib/notificationCopy.ts';
import { notificationVisual, resolveNotificationLink } from '../../lib/notificationUi.tsx';
import { detailLabel, notificationDetailLines } from '../../lib/notificationDetails.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';

type NotificationItemProps = {
  notification: Notification;
  locale: Locale;
  t: TranslateFn;
  compact?: boolean;
  onOpen: (notification: Notification, href: string | null) => void;
  onDelete?: (notificationId: string) => void;
  deletePending?: boolean;
  showDelete?: boolean;
};

export function NotificationItem({
  notification,
  locale,
  t,
  compact = false,
  onOpen,
  onDelete,
  deletePending = false,
  showDelete = false,
}: NotificationItemProps) {
  const visual = notificationVisual(notification.type);
  const href = resolveNotificationLink(notification);
  const copy = resolveNotificationCopy(notification, t, locale);
  const iconSize = compact ? 18 : 20;
  const wrapperClass = compact ? 'p-4 gap-3' : 'p-5 md:p-6 gap-4';
  const iconBoxClass = compact ? 'w-10 h-10 rounded-full' : 'w-12 h-12 rounded-2xl';
  const details = notificationDetailLines(notification);

  return (
    <div
      className={`${wrapperClass} flex items-start transition-colors hover:bg-gray-50/80 group ${
        !notification.is_read ? 'bg-amber-50/30 border-s-4 border-s-amber-400' : 'border-s-4 border-s-transparent'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(notification, href)}
        className="flex flex-1 gap-4 text-start cursor-pointer min-w-0"
      >
        <div
          className={`${iconBoxClass} flex items-center justify-center shrink-0 shadow-sm ${visual.bgColor} ${visual.color}`}
        >
          {notificationVisual(notification.type, iconSize).icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
            <h3
              className={`font-bold ${compact ? 'text-sm' : 'text-base'} ${
                !notification.is_read ? 'text-amber-900' : 'text-gray-800'
              }`}
            >
              {copy.title}
              {!notification.is_read && (
                <span className="sr-only"> ({t('notifications.unreadLabel')})</span>
              )}
            </h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeReviewDate(notification.created_at, locale)}
            </span>
          </div>

          <p
            className={`${compact ? 'text-xs line-clamp-2' : 'text-sm'} leading-relaxed mb-2 ${
              !notification.is_read ? 'text-gray-700' : 'text-gray-500'
            }`}
          >
            {copy.body}
          </p>

          {details.length > 0 && !compact && (
            <div className="flex flex-wrap gap-2">
              {details.map((line) => (
                <span
                  key={`${line.label}-${line.value}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-[11px] text-gray-600 max-w-full"
                >
                  <span className="font-bold text-gray-500 shrink-0">{detailLabel(t, line.label)}:</span>
                  <span className="truncate">{line.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {!notification.is_read && (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2" aria-hidden="true" />
        )}
      </button>

      {showDelete && onDelete && (
        <button
          type="button"
          disabled={deletePending}
          onClick={() => onDelete(notification.id)}
          aria-label={t('common.delete')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100 disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
