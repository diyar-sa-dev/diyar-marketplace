import { useState } from 'react';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../../hooks/profile/useNotifications.ts';
import { NotificationCenterPanel } from '../../components/notifications/NotificationCenterPanel.tsx';
import { NotificationToolbar } from '../../components/notifications/NotificationToolbar.tsx';
import { confirmDeleteAllNotifications } from '../../lib/confirmDialog.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { NotificationStatusFilter } from '../../types/notification.ts';

export default function Notifications() {
  const { t } = useLocale();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatusFilter>('all');
  const [category, setCategory] = useState<string | null>(null);

  const listQuery = useNotifications({ page, status, category });
  const unreadQuery = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();

  const notifications = listQuery.data?.notifications ?? [];
  const pagination = listQuery.data?.pagination;
  const unreadCount = unreadQuery.data ?? 0;

  const handleDeleteAll = async () => {
    const confirmed = await confirmDeleteAllNotifications(t);
    if (!confirmed) {
      return;
    }

    try {
      await deleteAll.mutateAsync();
      setPage(1);
    } catch {
      toast.error(t('notifications.actionError'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark flex items-center gap-2">
            {t('notifications.pageTitle')}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                {unreadCount} {t('notifications.newBadge')}
              </span>
            )}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('notifications.subtitle')}</p>
        </div>

        <NotificationToolbar
          t={t}
          unreadCount={unreadCount}
          hasNotifications={(pagination?.total ?? notifications.length) > 0}
          markAllPending={markAllRead.isPending}
          deleteAllPending={deleteAll.isPending}
          onMarkAllRead={() =>
            void markAllRead.mutateAsync().catch(() => toast.error(t('notifications.actionError')))
          }
          onDeleteAll={() => void handleDeleteAll()}
        />
      </div>

      <NotificationCenterPanel
        page={page}
        status={status}
        category={category}
        onPageChange={setPage}
        onStatusChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        onCategoryChange={(next) => {
          setCategory(next);
          setPage(1);
        }}
      />
    </div>
  );
}
