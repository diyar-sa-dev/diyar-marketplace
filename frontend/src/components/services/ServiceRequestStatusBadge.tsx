import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Sparkles, XCircle } from 'lucide-react';
import type { ServiceRequestStatus } from '../../types/serviceRequests.ts';

const STATUS_STYLES: Record<
  ServiceRequestStatus,
  { label: string; className: string; icon?: ReactNode }
> = {
  pending: {
    label: 'بانتظار العروض',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Clock size={12} />,
  },
  offers_received: {
    label: 'توجد عروض جديدة',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Sparkles size={12} />,
  },
  offer_accepted: {
    label: 'قيد التنفيذ',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock size={12} />,
  },
  in_progress: {
    label: 'قيد التنفيذ',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock size={12} />,
  },
  completed: {
    label: 'مكتمل',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 size={12} />,
  },
  cancelled: {
    label: 'ملغي',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle size={12} />,
  },
};

export function ServiceRequestStatusBadge({ status }: { status: ServiceRequestStatus }) {
  const config = STATUS_STYLES[status];
  if (!config) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export function serviceRequestAccentClass(status: ServiceRequestStatus): string {
  switch (status) {
    case 'offers_received':
      return 'border-s-4 border-s-amber-400';
    case 'offer_accepted':
    case 'in_progress':
      return 'border-s-4 border-s-blue-500';
    case 'completed':
      return 'border-s-4 border-s-emerald-500';
    case 'cancelled':
      return 'border-s-4 border-s-red-400';
    default:
      return 'border-s-4 border-s-gray-300';
  }
}
