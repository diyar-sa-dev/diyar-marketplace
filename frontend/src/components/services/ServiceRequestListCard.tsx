import { ArrowLeft, FileText, Star } from 'lucide-react';
import type { ServiceRequestCard } from '../../types/serviceRequests.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import { formatServiceRequestReference } from '../../lib/formatRelativeDay.ts';
import {
  ServiceRequestStatusBadge,
  serviceRequestAccentClass,
} from './ServiceRequestStatusBadge.tsx';

type ServiceRequestListCardProps = {
  item: ServiceRequestCard;
  locale: Locale;
  onClick: () => void;
  compact?: boolean;
};

export function ServiceRequestListCard({
  item,
  locale,
  onClick,
  compact = false,
}: ServiceRequestListCardProps) {
  const showOffersHint =
    item.offers_count > 0 && (item.status === 'offers_received' || item.status === 'pending');
  const showProvider =
    item.accepted_provider &&
    (item.status === 'completed' ||
      item.status === 'in_progress' ||
      item.status === 'offer_accepted');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => event.key === 'Enter' && onClick()}
      className={`bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-lg hover:border-diyar-brown/25 transition-all cursor-pointer group flex flex-col md:flex-row gap-5 items-start md:items-center ${serviceRequestAccentClass(item.status)} ${compact ? 'p-4' : ''}`}
    >
      <div
        className={`rounded-2xl bg-linear-to-br from-diyar-cream/60 to-white flex items-center justify-center text-diyar-brown shrink-0 border border-diyar-brown/10 ${compact ? 'w-12 h-12' : 'w-14 h-14'}`}
      >
        <FileText size={compact ? 18 : 20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <h3
            className={`font-bold text-diyar-dark group-hover:text-diyar-brown transition-colors ${compact ? 'text-base' : 'text-lg'}`}
          >
            {item.title}
          </h3>
          <ServiceRequestStatusBadge status={item.status} />
        </div>

        <p className="text-gray-500 text-sm mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-diyar-brown/80">
            {formatServiceRequestReference(item.reference)}
          </span>
          {item.created_at && (
            <span>تم الطلب في {formatOrderDate(item.created_at, locale)}</span>
          )}
        </p>

        {!compact && item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
        )}

        {showOffersHint && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>تلقيت {item.offers_count} عروض أسعار</span>
          </div>
        )}

        {showProvider && (
          <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
            <span className="text-gray-500">
              مقدم الخدمة:{' '}
              <strong className="text-gray-800">{item.accepted_provider?.name}</strong>
            </span>
            {item.accepted_price && (
              <span className="text-gray-500">
                التكلفة:{' '}
                <strong className="text-diyar-dark tabular-nums">
                  {item.accepted_price} {item.accepted_currency ?? 'ر.س'}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <div className="hidden md:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center text-gray-400 group-hover:bg-diyar-dark group-hover:text-white transition-colors shrink-0">
          <ArrowLeft
            size={18}
            className="translate-x-0 group-hover:-translate-x-1 transition-transform"
          />
        </div>
      )}
    </div>
  );
}
