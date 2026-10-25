import React from 'react';
import {
  Clock,
  CheckCircle2,
  FileText,
  User,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import type { ServiceRequestTimelineItem } from '../../types/serviceRequests.ts';

type ServiceRequestTimelineProps = {
  timelines: ServiceRequestTimelineItem[];
  currentStatus: string;
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export function ServiceRequestTimelineView({
  timelines,
  currentStatus,
  locale,
  t,
}: ServiceRequestTimelineProps) {
  if (!timelines || timelines.length === 0) {
    return null;
  }

  const getActorIcon = (actorType?: string | null) => {
    switch (actorType) {
      case 'provider':
        return <Wrench size={16} className="text-blue-600" />;
      case 'customer':
        return <User size={16} className="text-amber-600" />;
      case 'admin':
      case 'system':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
      <h3 className="font-bold text-diyar-dark mb-6 flex items-center gap-2">
        <Clock size={20} className="text-diyar-brown" />
        {t('serviceMarketplace.requests.timelineTitle') || 'سجل مراحل الطلب'}
      </h3>

      <div className="relative border-s border-gray-200 ms-3 space-y-6">
        {timelines.map((item, idx) => (
          <div key={item.id || idx} className="ms-6 relative">
            <span className="absolute -start-9.5 flex h-7 w-7 items-center justify-center rounded-full bg-diyar-cream/60 ring-4 ring-white shadow-xs">
              {getActorIcon(item.actor_type)}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                {item.created_at ? (
                  <span className="text-xs text-gray-400">
                    {formatOrderDate(item.created_at, locale)}
                  </span>
                ) : null}
              </div>
              {item.notes ? (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.notes}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
