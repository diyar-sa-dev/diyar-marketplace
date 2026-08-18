import type { ReturnRequestStatus } from '../../types/return.ts';

const STATUS_STYLES: Record<ReturnRequestStatus, string> = {
  requested: 'bg-amber-100 text-amber-900 border-amber-200',
  under_review: 'bg-blue-100 text-blue-900 border-blue-200',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  awaiting_return: 'bg-orange-100 text-orange-900 border-orange-200',
  received: 'bg-violet-100 text-violet-900 border-violet-200',
  inspected: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  refunded: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

type Props = {
  status: ReturnRequestStatus;
  label: string;
  className?: string;
};

export function ReturnStatusBadge({ status, label, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${STATUS_STYLES[status]} ${className}`}
    >
      {label}
    </span>
  );
}
