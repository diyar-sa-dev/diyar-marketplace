import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useReconcileNotifications,
  useUnreadNotificationCount,
} from '../../hooks/profile/useNotifications.ts';
import { NotificationItem } from './NotificationItem.tsx';
import { NotificationSkeleton } from './NotificationSkeleton.tsx';
import type { Notification } from '../../types/notification.ts';

type NotificationBellDropdownProps = {
  viewAllPath: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  variant?: 'default' | 'header';
};

export function NotificationBellDropdown({
  viewAllPath,
  open,
  onToggle,
  onClose,
  variant = 'default',
}: NotificationBellDropdownProps) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const reconcile = useReconcileNotifications();
  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotifications({ page: 1, status: 'all', category: null, perPage: 5 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadQuery.data ?? 0;
  const items = listQuery.data?.notifications ?? [];

  const handleOpenItem = (notification: Notification, href: string | null) => {
    if (!notification.is_read) {
      void markRead.mutateAsync(notification.id);
    }
    onClose();
    if (href) {
      navigate(href);
    }
  };

  const buttonClassName =
    variant === 'header'
      ? 'w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center relative cursor-pointer text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors'
      : 'relative p-2 text-gray-500 hover:text-diyar-dark transition-colors cursor-pointer rounded-xl hover:bg-gray-100';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            void reconcile();
          }
          onToggle();
        }}
        className={buttonClassName}
        aria-label={t('common.notifications')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 inset-e-0.5 min-w-4.5 h-4.5 px-1 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center"
            aria-label={t('notifications.unreadCountLabel', { count: unreadCount })}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
          <div className="absolute top-full inset-e-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2 bg-gray-50/60">
              <h3 className="font-bold text-diyar-dark">{t('common.notifications')}</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead.mutateAsync()}
                  className="inline-flex items-center gap-1 text-xs text-diyar-brown hover:text-diyar-dark font-bold cursor-pointer px-2 py-1 rounded-lg hover:bg-white transition"
                >
                  <CheckCheck size={14} />
                  {t('dashboard.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-[min(20rem,60vh)] overflow-y-auto">
              {listQuery.isLoading && items.length === 0 ? (
                <NotificationSkeleton count={3} compact />
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">{t('notifications.empty')}</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      locale={locale}
                      t={t}
                      compact
                      onOpen={handleOpenItem}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Link
                to={viewAllPath}
                onClick={onClose}
                className="block w-full text-center py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-diyar-dark hover:bg-gray-50 hover:border-diyar-brown transition cursor-pointer"
              >
                {t('dashboard.viewAllNotifications')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
