import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Sparkles, XCircle } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import type { ServiceRequestStatus } from '../../types/serviceRequests.ts';

const STATUS_ICONS: Record<ServiceRequestStatus, ReactNode> = {
  pending: <Clock size={12} />,
  offers_received: <Sparkles size={12} />,
  offer_accepted: <Clock size={12} />,
  in_progress: <Clock size={12} />,
  completed: <CheckCircle2 size={12} />,
  cancelled: <XCircle size={12} />,
};

const STATUS_CLASSES: Record<ServiceRequestStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  offers_received: 'bg-amber-100 text-amber-800 border-amber-200',
  offer_accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export function ServiceRequestStatusBadge({ status }: { status: ServiceRequestStatus }) {
  const { t } = useLocale();
  const className = STATUS_CLASSES[status];
  const icon = STATUS_ICONS[status];

  if (!className) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${className}`}
    >
      {icon}
      {t(`serviceMarketplace.status.${status}`)}
    </span>
  );
}
