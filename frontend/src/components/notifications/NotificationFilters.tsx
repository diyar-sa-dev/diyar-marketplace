import type { NotificationCategoryDefinition } from '../../types/notification.ts';
import type { NotificationStatusFilter } from '../../types/notification.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';

type NotificationFiltersProps = {
  t: TranslateFn;
  status: NotificationStatusFilter;
  category: string | null;
  categories: NotificationCategoryDefinition[];
  onStatusChange: (status: NotificationStatusFilter) => void;
  onCategoryChange: (category: string | null) => void;
};

export function NotificationFilters({
  t,
  status,
  category,
  categories,
  onStatusChange,
  onCategoryChange,
}: NotificationFiltersProps) {
  const statusOptions: NotificationStatusFilter[] = ['all', 'unread', 'read'];
  const filterableCategories = categories.filter((item) => item.filterable === true);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 mb-2">{t('notifications.filters.status')}</p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('notifications.filters.status')}>
          {statusOptions.map((option) => (
            <FilterButton
              key={option}
              active={status === option}
              onClick={() => onStatusChange(option)}
              label={t(`notifications.filters.${option}`)}
            />
          ))}
        </div>
      </div>

      {filterableCategories.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">{t('notifications.filters.category')}</p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('notifications.filters.category')}>
            <FilterButton
              active={!category || category === 'all'}
              onClick={() => onCategoryChange(null)}
              label={t('notifications.filters.allCategories')}
            />
            {filterableCategories.map((item) => (
              <FilterButton
                key={item.key}
                active={category === item.key}
                onClick={() => onCategoryChange(item.key)}
                label={item.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm ${
        active
          ? 'bg-diyar-dark text-white border border-diyar-dark'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-diyar-brown hover:text-diyar-dark hover:shadow'
      }`}
    >
      {label}
    </button>
  );
}
