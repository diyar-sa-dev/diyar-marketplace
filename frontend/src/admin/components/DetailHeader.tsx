import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
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
  const { dir } = useLocale();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-1 py-0.5 text-sm font-semibold text-diyar-brown transition hover:border-diyar-brown/20 hover:bg-[#f7f4f1] hover:text-diyar-dark"
        >
          <BackIcon size={16} aria-hidden />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold text-diyar-dark break-all">{title}</h2>
          {status ? <AdminStatusBadge status={status} /> : null}
        </div>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
