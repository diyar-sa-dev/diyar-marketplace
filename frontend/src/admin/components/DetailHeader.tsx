import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminStatusBadge } from './AdminStatusBadge.tsx';

type DetailHeaderProps = {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  status?: string;
  actions?: React.ReactNode;
};

export function DetailHeader({
  backTo,
  backLabel,
  title,
  subtitle,
  status,
  actions,
}: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-diyar-brown hover:text-diyar-dark"
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold text-diyar-dark">{title}</h2>
          {status ? <AdminStatusBadge status={status} /> : null}
        </div>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
