import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { LoadingState } from '../common/LoadingState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { ProviderReviewModal } from '../modals/DirectBookingModal.tsx';
import {
  useAcceptBookingSchedule,
  useCancelCustomerBooking,
  useCustomerServiceBookings,
  useDeclineBookingSchedule,
  useDirectBookingPayment,
} from '../../hooks/services/useServiceBookings.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { bookingStatusBadgeClass, resolveBookingTitle } from '../../lib/serviceBookingDisplay.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ServiceBooking } from '../../types/serviceRequests.ts';
import { BookingScheduleSection } from '../services/BookingScheduleSection.tsx';
import {
  hasScheduleNegotiation,
  resolveAppointmentDisplay,
} from '../../lib/scheduleNegotiation.ts';

function bookingStatusLabel(status: ServiceBooking['status'], t: (key: string) => string): string {
  return t(`serviceBookings.status.${status}`);
}

function ServiceBookingCard({
  booking,
  t,
  dir,
  locale,
  onReview,
  onChanged,
}: {
  booking: ServiceBooking;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
  locale: Locale;
  onReview: (booking: ServiceBooking) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const paymentMutation = useDirectBookingPayment();
  const acceptMutation = useAcceptBookingSchedule();
  const declineMutation = useDeclineBookingSchedule();
  const cancelMutation = useCancelCustomerBooking();

  const title = resolveBookingTitle(booking, t('serviceBookings.defaultServiceTitle'));
  const providerName = booking.provider?.name ?? '—';
  const statusClass = bookingStatusBadgeClass(booking.status);
  const appointment = resolveAppointmentDisplay(booking);

  const runAction = async (action: () => Promise<unknown>, successKey: string) => {
    try {
      await action();
      toast.success(t(successKey));
      onChanged();
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handlePay = async (outcome: 'paid' | 'failed') => {
    try {
      await paymentMutation.mutateAsync({ bookingId: booking.id, outcome });
      if (outcome === 'paid') {
        toast.success(t('directBooking.paymentSuccess'));
        setPayOpen(false);
        onChanged();
      } else {
        toast.error(t('directBooking.paymentFailed'));
      }
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const isBusy =
    paymentMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending ||
    cancelMutation.isPending;

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-1.5 bg-linear-to-r from-diyar-brown via-diyar-dark to-diyar-brown" />
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 font-semibold tracking-wide mb-1.5">
              {booking.reference}
            </p>
            <h3 className="font-bold text-lg text-diyar-dark leading-snug">{title}</h3>
            <p className="text-sm text-gray-500 mt-1.5">{providerName}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${statusClass}`}
          >
            {bookingStatusLabel(booking.status, t)}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
          {!hasScheduleNegotiation(booking) && appointment.date !== '—' && (
            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              <Calendar size={14} className="text-diyar-brown" />
              <span dir="ltr">
                {appointment.date}
                {appointment.time !== '—' ? ` · ${appointment.time}` : ''}
              </span>
            </span>
          )}
          {!hasScheduleNegotiation(booking) && booking.location && (
            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              <MapPin size={14} className="text-diyar-brown" />
              {booking.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-diyar-cream/40 border border-diyar-brown/10 px-3 py-1.5 rounded-xl font-bold text-diyar-dark">
            {booking.price} {booking.currency}
          </span>
        </div>

        {booking.customer_notes?.trim() && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4">
            {booking.customer_notes}
          </p>
        )}

        {booking.service?.description?.trim() && (
          <p className="text-sm text-gray-600 bg-diyar-cream/20 border border-diyar-brown/10 rounded-xl px-4 py-3 mb-4 line-clamp-3">
            {booking.service.description}
          </p>
        )}

        {booking.service_request?.description?.trim() && !booking.service?.description?.trim() && (
          <p className="text-sm text-gray-600 bg-diyar-cream/20 border border-diyar-brown/10 rounded-xl px-4 py-3 mb-4 line-clamp-3">
            {booking.service_request.description}
          </p>
        )}

        {booking.status === 'pending_provider_confirmation' && (
          <p className="text-sm text-sky-700 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 mb-4">
            {t('serviceBookings.awaitingProvider')}
          </p>
        )}

        {hasScheduleNegotiation(booking) && (
          <div className="mb-4">
            <BookingScheduleSection
              booking={booking}
              t={t}
              translationPrefix="serviceBookings"
              location={booking.location}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {booking.can_accept_schedule && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  void runAction(
                    () => acceptMutation.mutateAsync(booking.id),
                    'serviceBookings.acceptSuccess',
                  )
                }
                className="bg-diyar-brown text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 cursor-pointer disabled:opacity-60"
              >
                {t('serviceBookings.acceptSchedule')}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  void runAction(
                    () => declineMutation.mutateAsync(booking.id),
                    'serviceBookings.declineSuccess',
                  )
                }
                className="border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 cursor-pointer disabled:opacity-60"
              >
                {t('serviceBookings.declineSchedule')}
              </button>
            </>
          )}

          {booking.can_pay && !payOpen && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setPayOpen(true)}
              className="inline-flex items-center gap-1.5 bg-diyar-dark text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black cursor-pointer disabled:opacity-60"
            >
              <CreditCard size={16} /> {t('serviceBookings.payNow')}
            </button>
          )}

          {payOpen && booking.can_pay && (
            <div className="w-full flex flex-wrap gap-2 pt-2 border-t border-gray-100 mt-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void handlePay('paid')}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 cursor-pointer disabled:opacity-60"
              >
                {paymentMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  t('directBooking.simulatePaid')
                )}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setPayOpen(false)}
                className="text-gray-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}

          {booking.can_cancel &&
            !['pending_customer_acceptance'].includes(booking.status) &&
            booking.status !== 'pending_payment' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  void runAction(
                    () => cancelMutation.mutateAsync(booking.id),
                    'serviceBookings.cancelSuccess',
                  )
                }
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-60"
              >
                <XCircle size={16} /> {t('serviceBookings.cancelBooking')}
              </button>
            )}

          {booking.can_review && (
            <button
              type="button"
              onClick={() => onReview(booking)}
              className="inline-flex items-center gap-1.5 bg-diyar-brown text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 cursor-pointer"
            >
              <Sparkles size={16} /> {t('serviceBookings.rateService')}
            </button>
          )}

          {booking.review && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-50 border border-green-100 px-4 py-2 rounded-xl">
              <CheckCircle2 size={16} /> {t('serviceBookings.alreadyReviewed')}
            </span>
          )}

          {booking.service?.slug && (
            <Link
              to={`/service/${booking.service.slug}`}
              className="text-sm font-bold text-diyar-brown hover:text-diyar-dark px-2 py-2"
            >
              {t('serviceBookings.viewService')}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function CustomerServiceBookingsPanel({ embedded = false }: { embedded?: boolean }) {
  const { t, dir, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [reviewBooking, setReviewBooking] = useState<ServiceBooking | null>(null);

  const { data, isLoading, isError, error, refetch } = useCustomerServiceBookings(page, 10);
  const bookings = data?.items ?? [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <LoadingState className="min-h-64" />;
  }

  if (isError) {
    return <ErrorState error={error as Error} onRetry={() => void refetch()} />;
  }

  return (
    <div dir={dir}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-diyar-dark">{t('serviceBookings.title')}</h1>
          <p className="text-gray-500 text-sm mt-2">{t('serviceBookings.subtitle')}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          title={t('serviceBookings.emptyTitle')}
          description={t('serviceBookings.emptyDescription')}
          action={
            <Link to="/services" className="text-diyar-brown font-bold hover:text-diyar-dark">
              {t('serviceMarketplace.catalog.viewAll')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <ServiceBookingCard
              key={booking.id}
              booking={booking}
              t={t}
              dir={dir}
              locale={locale}
              onReview={setReviewBooking}
              onChanged={() => void refetch()}
            />
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <PaginationBar
          pagination={pagination}
          page={page}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      {reviewBooking && (
        <ProviderReviewModal
          isOpen
          bookingId={reviewBooking.id}
          serviceTitle={resolveBookingTitle(
            reviewBooking,
            t('serviceBookings.defaultServiceTitle'),
          )}
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => void refetch()}
        />
      )}
    </div>
  );
}
