import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, Settings } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { resolveAccountHubPath } from '../lib/auth/roles.ts';
import { useLocale } from '../hooks/useLocale.ts';
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../hooks/profile/useNotifications.ts';
import { NotificationCenterPanel } from '../components/notifications/NotificationCenterPanel.tsx';
import { NotificationToolbar } from '../components/notifications/NotificationToolbar.tsx';
import { confirmDeleteAllNotifications } from '../lib/confirmDialog.ts';
import { useToast } from '../hooks/useToast.ts';
import type { NotificationStatusFilter } from '../types/notification.ts';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const accountHubPath = resolveAccountHubPath(user?.roles);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatusFilter>('all');
  const [category, setCategory] = useState<string | null>(null);

  const listQuery = useNotifications({ page, status, category });
  const unreadQuery = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();

  const pagination = listQuery.data?.pagination;
  const notifications = listQuery.data?.notifications ?? [];
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
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.home')}
            </Link>
            <ChevronLeft size={16} />
            <Link to={accountHubPath} className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">{t('common.notifications')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-diyar-dark flex items-center gap-2 flex-wrap">
                {t('notifications.pageTitle')}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                    {unreadCount} {t('notifications.newBadge')}
                  </span>
                )}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{t('notifications.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
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
            <Link
              to="/profile/notification-settings"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-diyar-dark hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label={t('notifications.settingsTitle')}
            >
              <Settings size={20} />
            </Link>
          </div>
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
    </div>
  );
}
