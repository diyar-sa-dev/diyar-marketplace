import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/profile/useNotifications.ts';
import { useNotificationPreferences } from '../../hooks/profile/useNotificationPreferences.ts';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { NotificationFilters } from './NotificationFilters.tsx';
import { NotificationItem } from './NotificationItem.tsx';
import { NotificationEmptyState } from './NotificationEmptyState.tsx';
import {
  NotificationFiltersSkeleton,
  NotificationSkeleton,
} from './NotificationSkeleton.tsx';
import type { Notification } from '../../types/notification.ts';
import type { NotificationStatusFilter } from '../../types/notification.ts';

const DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 20, 30, 50];

type NotificationCenterPanelProps = {
  page: number;
  status: NotificationStatusFilter;
  category: string | null;
  onPageChange: (page: number) => void;
  onStatusChange: (status: NotificationStatusFilter) => void;
  onCategoryChange: (category: string | null) => void;
};

export function NotificationCenterPanel({
  page,
  status,
  category,
  onPageChange,
  onStatusChange,
  onCategoryChange,
}: NotificationCenterPanelProps) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const preferencesQuery = useNotificationPreferences();
  const listQuery = useNotifications({ page, status, category, perPage });
  const markRead = useMarkNotificationRead();
  const deleteOne = useDeleteNotification();

  const notifications = listQuery.data?.notifications ?? [];
  const pagination = listQuery.data?.pagination;
  const categories = preferencesQuery.data?.categories ?? [];
  const isInitialLoading = listQuery.isLoading;
  const isPageLoading = listQuery.isFetching && !listQuery.isLoading;

  const handleOpen = (notification: Notification, href: string | null) => {
    if (!notification.is_read) {
      void markRead.mutateAsync(notification.id).catch(() => toast.error(t('notifications.actionError')));
    }
    if (href) {
      navigate(href);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        {preferencesQuery.isLoading ? (
          <NotificationFiltersSkeleton />
        ) : (
          <NotificationFilters
            t={t}
            status={status}
            category={category}
            categories={categories}
            onStatusChange={onStatusChange}
            onCategoryChange={onCategoryChange}
          />
        )}
      </div>

      <div className="relative bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isInitialLoading ? (
          <NotificationSkeleton count={6} />
        ) : listQuery.isError ? (
          <ErrorState
            message={t('notifications.loadError')}
            onRetry={() => void listQuery.refetch()}
            className="py-16"
          />
        ) : notifications.length > 0 ? (
          <>
            <div
              className={`divide-y divide-gray-50 transition-opacity duration-200 ${
                isPageLoading ? 'opacity-60' : 'opacity-100'
              }`}
            >
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  locale={locale}
                  t={t}
                  onOpen={handleOpen}
                  showDelete
                  onDelete={(id) =>
                    void deleteOne.mutateAsync(id).catch(() => toast.error(t('notifications.actionError')))
                  }
                  deletePending={deleteOne.isPending}
                />
              ))}
            </div>
            {pagination && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/40">
                <PaginationBar
                  pagination={pagination}
                  page={page}
                  perPage={perPage}
                  perPageOptions={PER_PAGE_OPTIONS}
                  onPageChange={onPageChange}
                  onPerPageChange={(next) => {
                    setPerPage(next);
                    onPageChange(1);
                  }}
                  isLoading={isPageLoading}
                  alwaysShow={pagination.total > 0}
                />
              </div>
            )}
          </>
        ) : (
          <NotificationEmptyState
            t={t}
            status={status}
            hasCategoryFilter={Boolean(category && category !== 'all')}
          />
        )}
      </div>
    </div>
  );
}
