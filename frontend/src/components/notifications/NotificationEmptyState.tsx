import { Bell } from 'lucide-react';
import type { TranslateFn } from '../../lib/i18n/types.ts';
import type { NotificationStatusFilter } from '../../types/notification.ts';

type NotificationEmptyStateProps = {
  t: TranslateFn;
  status: NotificationStatusFilter;
  hasCategoryFilter: boolean;
};

export function NotificationEmptyState({ t, status, hasCategoryFilter }: NotificationEmptyStateProps) {
  const messageKey =
    status === 'unread'
      ? 'notifications.emptyUnread'
      : hasCategoryFilter
        ? 'notifications.emptyCategory'
        : 'notifications.empty';

  return (
    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Bell size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-diyar-dark mb-2">{t('notifications.emptyTitle')}</h3>
      <p className="text-sm">{t(messageKey)}</p>
    </div>
  );
}
