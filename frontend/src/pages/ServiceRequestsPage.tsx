import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Star, Calendar, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { ServiceRequestDetailSection } from '../components/services/ServiceRequestDetailSection.tsx';
import { ServiceRequestListCard } from '../components/services/ServiceRequestListCard.tsx';
import { ServiceRequestStatusBadge } from '../components/services/ServiceRequestStatusBadge.tsx';
import {
  useAcceptServiceOffer,
  useRejectServiceOffer,
  useServiceRequest,
  useServiceRequests,
  useSimulateServiceBookingPayment,
} from '../hooks/services/useServiceRequests.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { formatOrderDate } from '../lib/formatOrderDate.ts';
import { formatRelativeOfferDay, formatServiceRequestReference } from '../lib/formatRelativeDay.ts';

const OFFERS_PER_PAGE = 3;

export default function ServiceRequestsPage() {
  const { t, locale, dir } = useLocale();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(searchParams.get('id'));

  const [offersPage, setOffersPage] = useState(1);
  const [rejectingOfferId, setRejectingOfferId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    setSelectedRequestId(id);
    setOffersPage(1);
  }, [searchParams]);

  const listQuery = useServiceRequests(page, activeTab);
  const detailQuery = useServiceRequest(selectedRequestId ?? undefined);
  const acceptOffer = useAcceptServiceOffer();
  const rejectOffer = useRejectServiceOffer();
  const simulatePayment = useSimulateServiceBookingPayment();

  const requests = listQuery.data?.items ?? [];
  const request = detailQuery.data;

  const pendingOffers = request?.offers?.filter((offer) => offer.status === 'pending') ?? [];

  const paginatedOffers = useMemo(() => {
    const start = (offersPage - 1) * OFFERS_PER_PAGE;
    return pendingOffers.slice(start, start + OFFERS_PER_PAGE);
  }, [pendingOffers, offersPage]);

  const offersPagination = useMemo(
    () => ({
      current_page: offersPage,
      last_page: Math.max(1, Math.ceil(pendingOffers.length / OFFERS_PER_PAGE)),
      per_page: OFFERS_PER_PAGE,
      total: pendingOffers.length,
    }),
    [offersPage, pendingOffers.length],
  );

  const handleRejectOffer = async (offerId: string) => {
    setRejectingOfferId(offerId);
    try {
      await rejectOffer.mutateAsync(offerId);
      toast.success(t('serviceMarketplace.requests.rejectSuccess'));
      void detailQuery.refetch();
      void listQuery.refetch();
    } catch {
      toast.error(t('serviceMarketplace.requests.rejectError'));
    } finally {
      setRejectingOfferId(null);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptOffer.mutateAsync({ offerId });
      toast.success(t('serviceMarketplace.requests.acceptSuccess'));
      void detailQuery.refetch();
      void listQuery.refetch();
    } catch {
      toast.error(t('serviceMarketplace.requests.acceptError'));
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    try {
      await simulatePayment.mutateAsync({ bookingId, outcome: 'paid' });
      toast.success(t('serviceMarketplace.requests.paySuccess'));
      void detailQuery.refetch();
    } catch {
      toast.error(t('serviceMarketplace.requests.payError'));
    }
  };

  if (selectedRequestId && detailQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingState className="min-h-64" />
      </div>
    );
  }

  if (selectedRequestId && request) {
    const booking = request.booking ?? request.accepted_offer?.booking;
    const categoryLabel =
      request.categories && request.categories.length > 0
        ? locale === 'ar'
          ? request.categories.map((category) => category.name_ar).join('، ')
          : request.categories.map((category) => category.name_en).join(', ')
        : null;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24" dir={dir}>
        <button
          type="button"
          onClick={() => {
            setSelectedRequestId(null);
            searchParams.delete('id');
            setSearchParams(searchParams, { replace: true });
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-diyar-brown mb-6 transition-colors cursor-pointer font-bold"
        >
          <BackIcon size={20} />
          <span>{t('serviceMarketplace.requests.backToList')}</span>
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-br from-diyar-cream/30 via-white to-white pointer-events-none" />
          <div className="relative">
            <div className="flex flex-wrap gap-4 items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-sm font-mono font-bold text-diyar-brown bg-diyar-brown/10 px-3 py-1 rounded-lg">
                    {formatServiceRequestReference(request.reference)}
                  </span>
                  <ServiceRequestStatusBadge status={request.status} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-2 leading-snug">
                  {request.title}
                </h1>
                <p className="text-gray-500 text-sm">
                  {request.created_at ? formatOrderDate(request.created_at, locale) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ServiceRequestDetailSection
            request={request}
            booking={booking}
            t={t}
            locale={locale}
            categoryLabel={categoryLabel}
          />
        </div>

        {booking?.status === 'pending_provider_confirmation' && (
          <div className="mb-8 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <p className="font-bold text-sky-900 mb-1">
              {t('serviceMarketplace.requests.awaitingProviderConfirmation')}
            </p>
            <p className="text-sm text-sky-800">{t('serviceBookings.awaitingProvider')}</p>
          </div>
        )}

        {booking?.status === 'pending_payment' && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="font-bold text-amber-900 mb-2">
              {t('serviceMarketplace.requests.pendingPaymentTitle')}
            </p>
            <p className="text-sm text-amber-800 mb-4" dir="ltr">
              {t('serviceMarketplace.requests.amountLabel')} {booking.price} {booking.currency}
            </p>
            <button
              type="button"
              onClick={() => void handlePayBooking(booking.id)}
              disabled={simulatePayment.isPending}
              className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-diyar-brown transition-colors cursor-pointer disabled:opacity-60"
            >
              {simulatePayment.isPending
                ? t('serviceMarketplace.requests.paying')
                : t('serviceMarketplace.requests.completePayment')}
            </button>
          </div>
        )}

        {detailQuery.isFetching && !detailQuery.isLoading ? (
          <div className="mb-8 space-y-4 animate-pulse">
            <div className="h-40 rounded-3xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        ) : null}

        {pendingOffers.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold text-diyar-dark mb-6 flex items-center gap-2">
              {t('serviceMarketplace.requests.availableOffers')}
              <span className="bg-diyar-dark text-white text-xs px-2.5 py-1 rounded-full min-w-7 text-center">
                {pendingOffers.length}
              </span>
            </h2>

            <div className="space-y-5">
              {paginatedOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border text-start border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:border-diyar-brown/20 transition-all"
                >
                  <div className="h-1 bg-linear-to-r from-diyar-brown via-diyar-cream to-diyar-brown" />
                  <div className="p-6 md:p-7">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                          <h3 className="font-bold text-xl text-diyar-dark">
                            {offer.provider?.name ??
                              t('serviceMarketplace.requests.providerFallback')}
                          </h3>
                          {offer.created_at && (
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                              {formatRelativeOfferDay(offer.created_at, locale)}
                            </span>
                          )}
                        </div>

                        {offer.provider?.rating_average != null && (
                          <div className="flex items-center gap-1.5 mb-4 bg-amber-50 w-fit px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 border border-amber-100">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span>{offer.provider.rating_average.toFixed(1)}</span>
                            <span className="text-amber-600/70 font-normal">
                              {t('serviceMarketplace.requests.reviewsCount', {
                                count: offer.provider.reviews_count ?? 0,
                              })}
                            </span>
                          </div>
                        )}

                        {offer.message && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            {offer.message}
                          </p>
                        )}

                        {(offer.proposed_scheduled_date || offer.proposed_scheduled_time) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-5">
                            <Calendar size={16} className="text-diyar-brown" />
                            <span className="font-medium">
                              {t('serviceMarketplace.requests.proposedSchedule')}:
                            </span>
                            <span dir="ltr" className="font-bold text-diyar-dark">
                              {[offer.proposed_scheduled_date, offer.proposed_scheduled_time]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => void handleAcceptOffer(offer.id)}
                            disabled={acceptOffer.isPending}
                            className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-diyar-brown transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {acceptOffer.isPending ? (
                              <Loader2 size={16} className="animate-spin inline" />
                            ) : (
                              t('serviceMarketplace.requests.acceptOffer')
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRejectOffer(offer.id)}
                            disabled={rejectingOfferId === offer.id || rejectOffer.isPending}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
                          >
                            {rejectingOfferId === offer.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              t('serviceMarketplace.requests.rejectOffer')
                            )}
                          </button>
                          <span
                            aria-disabled="true"
                            title={t('serviceMarketplace.requests.chatDisabled')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-70"
                          >
                            {t('serviceMarketplace.requests.chat')}
                          </span>
                        </div>
                      </div>

                      <div className="lg:w-56 shrink-0 bg-linear-to-br from-diyar-cream/30 to-white rounded-2xl p-5 flex flex-col justify-center items-center border border-diyar-cream gap-4">
                        <div className="text-center">
                          <span className="block text-xs text-gray-500 mb-1">
                            {t('serviceMarketplace.requests.proposedPrice')}
                          </span>
                          <span
                            className="block text-3xl font-bold text-diyar-dark tabular-nums"
                            dir="ltr"
                          >
                            {offer.proposed_price} {offer.currency}
                          </span>
                        </div>
                        {offer.duration_days != null && (
                          <>
                            <div className="h-px w-full bg-gray-200" />
                            <div className="text-center">
                              <span className="block text-xs text-gray-500 mb-1">
                                {t('serviceMarketplace.requests.executionDuration')}
                              </span>
                              <span className="block font-bold text-gray-800">
                                {t('serviceMarketplace.requests.durationDays', {
                                  count: offer.duration_days,
                                })}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {offersPagination.last_page > 1 && (
              <PaginationBar
                pagination={offersPagination}
                page={offersPage}
                onPageChange={setOffersPage}
                className="mt-8"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24" dir={dir}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-2">
            {t('serviceMarketplace.requests.pageTitle')}
          </h1>
          <p className="text-gray-500">{t('serviceMarketplace.requests.pageSubtitle')}</p>
        </div>
        <Link
          to="/services"
          className="bg-diyar-brown text-white px-6 py-3 rounded-full font-bold hover:bg-diyar-dark transition-colors flex items-center justify-center gap-2 w-full md:w-auto shrink-0 shadow-sm hover:shadow-md cursor-pointer"
        >
          <Plus size={20} /> {t('serviceMarketplace.requests.newRequest')}
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
        {(['all', 'pending', 'offers_received', 'in_progress', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-diyar-dark text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t(`serviceMarketplace.requests.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <LoadingState className="min-h-64" />
      ) : listQuery.isError ? (
        <ErrorState
          message={t('serviceMarketplace.requests.loadError')}
          error={listQuery.error as Error}
          onRetry={() => void listQuery.refetch()}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={t('serviceMarketplace.requests.emptyTitle')}
          description={t('serviceMarketplace.requests.emptyDescription')}
        />
      ) : (
        <>
          <div className="space-y-4">
            {requests.map((item) => (
              <ServiceRequestListCard
                key={item.id}
                item={item}
                locale={locale}
                onClick={() => {
                  setSelectedRequestId(item.id);
                  setSearchParams({ id: item.id }, { replace: true });
                }}
              />
            ))}
          </div>

          {listQuery.data?.pagination && (
            <PaginationBar
              pagination={listQuery.data.pagination}
              page={page}
              onPageChange={setPage}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
}
