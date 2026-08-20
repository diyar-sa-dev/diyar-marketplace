import { CheckCheck, Trash2 } from 'lucide-react';
import type { TranslateFn } from '../../lib/i18n/types.ts';

type NotificationToolbarProps = {
  t: TranslateFn;
  unreadCount: number;
  hasNotifications: boolean;
  markAllPending?: boolean;
  deleteAllPending?: boolean;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
};

export function NotificationToolbar({
  t,
  unreadCount,
  hasNotifications,
  markAllPending = false,
  deleteAllPending = false,
  onMarkAllRead,
  onDeleteAll,
}: NotificationToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {unreadCount > 0 && (
        <button
          type="button"
          disabled={markAllPending}
          onClick={onMarkAllRead}
          className="inline-flex items-center justify-center gap-2 min-w-10 h-10 px-3 rounded-xl text-diyar-brown hover:text-diyar-dark font-bold transition-all cursor-pointer bg-white border border-gray-200 hover:border-diyar-brown hover:bg-amber-50/40 disabled:opacity-50"
          title={t('dashboard.markAllRead')}
          aria-label={t('dashboard.markAllRead')}
        >
          <CheckCheck size={18} />
          <span className="hidden sm:inline text-sm">{t('dashboard.markAllRead')}</span>
        </button>
      )}
      {hasNotifications && (
        <button
          type="button"
          disabled={deleteAllPending}
          onClick={onDeleteAll}
          className="inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-xl text-red-600 hover:text-red-700 font-bold transition-all cursor-pointer bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
          title={t('notifications.deleteAll')}
          aria-label={t('notifications.deleteAll')}
        >
          <Trash2 size={18} />
          <span className="hidden sm:inline text-sm ms-2">{t('notifications.deleteAll')}</span>
        </button>
      )}
    </div>
  );
}
