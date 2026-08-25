import { localizedStatusLabel } from '../utils/localizedStatus.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type AdminStatusBadgeProps = {
  status?: string | null;
  label?: string;
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-red-50 text-red-700 border-red-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  suspended: 'bg-red-50 text-red-700 border-red-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  approved: 'bg-blue-50 text-blue-700 border-blue-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  processing: 'bg-sky-50 text-sky-700 border-sky-100',
  cancelled: 'bg-gray-50 text-gray-600 border-gray-100',
  draft: 'bg-gray-50 text-gray-600 border-gray-100',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-amber-50 text-amber-700 border-amber-100',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
  const { t } = useLocale();
  const safeStatus = status ?? 'unknown';
  const normalized = safeStatus.toLowerCase();
  const style = STATUS_STYLES[normalized] ?? 'bg-gray-50 text-gray-600 border-gray-100';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {label ?? localizedStatusLabel(safeStatus, t)}
    </span>
  );
}
