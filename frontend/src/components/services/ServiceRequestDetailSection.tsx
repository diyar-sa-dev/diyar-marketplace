import React from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Link2,
  MapPin,
  Paperclip,
} from 'lucide-react';
import { BookingScheduleSection } from './BookingScheduleSection.tsx';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import { formatProviderBudget, formatAttachmentSize } from '../../lib/providerDashboardUi.ts';
import type { ServiceRequestDetail } from '../../types/serviceRequests.ts';
import type { Locale } from '../../lib/i18n/types.ts';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type ServiceRequestDetailSectionProps = {
  request: ServiceRequestDetail;
  booking?: ServiceRequestDetail['booking'];
  t: TranslateFn;
  locale: Locale;
  categoryLabel?: string | null;
};

export function ServiceRequestDetailSection({
  request,
  booking,
  t,
  locale,
  categoryLabel,
}: ServiceRequestDetailSectionProps) {
  const attachments = request.attachments ?? [];
  const referenceLinks = request.reference_links?.filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-linear-to-r from-diyar-brown via-diyar-cream to-diyar-brown" />
        <div className="p-6 md:p-8 space-y-6">
          {categoryLabel ? (
            <div className="inline-flex items-center gap-2 bg-diyar-cream/40 text-diyar-brown text-sm font-bold px-4 py-2 rounded-xl border border-diyar-brown/10">
              <FileText size={16} />
              {categoryLabel}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetaTile
              icon={<MapPin size={20} />}
              label={t('serviceMarketplace.requests.location')}
              value={request.location?.trim() || '—'}
            />
            <MetaTile
              icon={<DollarSign size={20} />}
              label={t('serviceMarketplace.requests.suggestedBudget')}
              value={formatProviderBudget(request.budget_min, request.budget_max, locale)}
              dir="ltr"
            />
            <MetaTile
              icon={<Clock size={20} />}
              label={t('serviceMarketplace.requests.submittedOn')}
              value={request.created_at ? formatOrderDate(request.created_at, locale) : '—'}
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-linear-to-br from-gray-50/80 to-white p-5 md:p-6">
            <h3 className="font-bold text-diyar-dark mb-3 flex items-center gap-2">
              <FileText size={18} className="text-diyar-brown" />
              {t('serviceMarketplace.requests.requestDetails')}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {request.description}
            </p>
          </div>

          {referenceLinks.length > 0 ? (
            <div>
              <h3 className="font-bold text-diyar-dark mb-3 flex items-center gap-2">
                <Link2 size={18} className="text-diyar-brown" />
                {t('serviceMarketplace.requests.referenceLinks')}
              </h3>
              <div className="flex flex-col gap-2">
                {referenceLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm hover:border-diyar-brown/30 hover:bg-diyar-cream/20 transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-diyar-cream/40 text-diyar-brown flex items-center justify-center shrink-0">
                      <ExternalLink size={16} />
                    </span>
                    <span className="truncate text-diyar-dark font-medium group-hover:text-diyar-brown">
                      {link}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {attachments.length > 0 ? (
            <div>
              <h3 className="font-bold text-diyar-dark mb-3 flex items-center gap-2">
                <Paperclip size={18} className="text-diyar-brown" />
                {t('serviceMarketplace.requests.attachmentsCount', { count: attachments.length })}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white text-diyar-brown flex items-center justify-center shadow-sm shrink-0">
                      <Paperclip size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {file.original_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatAttachmentSize(file.size_bytes)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {booking ? (
        <BookingScheduleSection
          booking={booking}
          t={t}
          translationPrefix="serviceBookings"
          location={booking.location ?? request.location}
        />
      ) : null}

      {booking?.customer_notes?.trim() ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 md:p-6">
          <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            <Calendar size={18} />
            {t('serviceMarketplace.requests.customerNotes')}
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
            {booking.customer_notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MetaTile({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="w-11 h-11 rounded-2xl bg-diyar-cream/30 text-diyar-brown flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="font-bold text-diyar-dark truncate" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}
