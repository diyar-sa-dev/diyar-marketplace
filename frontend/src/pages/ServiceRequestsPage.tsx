import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  FileText,
  Plus,
  Star,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { ServiceRequestListCard } from '../components/services/ServiceRequestListCard.tsx';
import { ServiceRequestStatusBadge } from '../components/services/ServiceRequestStatusBadge.tsx';
import {
  useAcceptServiceOffer,
  useServiceRequest,
  useServiceRequests,
  useSimulateServiceBookingPayment,
} from '../hooks/services/useServiceRequests.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { formatOrderDate } from '../lib/formatOrderDate.ts';
import {
  formatRelativeOfferDay,
  formatServiceRequestReference,
} from '../lib/formatRelativeDay.ts';

export default function ServiceRequestsPage() {
  const { locale, dir } = useLocale();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    searchParams.get('id'),
  );

  useEffect(() => {
    const id = searchParams.get('id');
    setSelectedRequestId(id);
  }, [searchParams]);

  const listQuery = useServiceRequests(page, activeTab);
  const detailQuery = useServiceRequest(selectedRequestId ?? undefined);
  const acceptOffer = useAcceptServiceOffer();
  const simulatePayment = useSimulateServiceBookingPayment();

  const requests = listQuery.data?.items ?? [];
  const request = detailQuery.data;

  const pendingOffers =
    request?.offers?.filter((offer) => offer.status === 'pending') ?? [];

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptOffer.mutateAsync({ offerId });
      toast.success('تم قبول العرض. أكمل الدفع لتأكيد الحجز.');
      void detailQuery.refetch();
      void listQuery.refetch();
    } catch {
      toast.error('تعذر قبول العرض.');
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    try {
      await simulatePayment.mutateAsync({ bookingId, outcome: 'paid' });
      toast.success('تم الدفع بنجاح.');
      void detailQuery.refetch();
    } catch {
      toast.error('تعذر إتمام الدفع.');
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
          <ArrowRight size={20} />
          <span>العودة للطلبات</span>
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-br from-diyar-cream/30 via-white to-white pointer-events-none" />
          <div className="relative">
            <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
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
              {categoryLabel && (
                <div className="bg-white/90 backdrop-blur px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-gray-500 text-xs block mb-1">نوع الخدمة</span>
                  <span className="font-bold text-diyar-dark text-sm">{categoryLabel}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50/90 p-5 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-diyar-brown" /> تفاصيل الطلب
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {request.description}
              </p>
            </div>
          </div>
        </div>

        {booking?.status === 'pending_payment' && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="font-bold text-amber-900 mb-2">الحجز بانتظار الدفع</p>
            <p className="text-sm text-amber-800 mb-4">
              المبلغ: {booking.price} {booking.currency}
            </p>
            <button
              type="button"
              onClick={() => void handlePayBooking(booking.id)}
              disabled={simulatePayment.isPending}
              className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-diyar-brown transition-colors cursor-pointer disabled:opacity-60"
            >
              {simulatePayment.isPending ? 'جاري الدفع...' : 'إتمام الدفع'}
            </button>
          </div>
        )}

        {pendingOffers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-diyar-dark mb-6 flex items-center gap-2">
              عروض الأسعار المتاحة
              <span className="bg-diyar-dark text-white text-xs px-2.5 py-1 rounded-full min-w-7 text-center">
                {pendingOffers.length}
              </span>
            </h2>

            <div className="space-y-4">
              {pendingOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border text-right border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-diyar-brown/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
                        <h3 className="font-bold text-lg text-diyar-dark">
                          {offer.provider?.name ?? 'مزود الخدمة'}
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
                            ({offer.provider.reviews_count ?? 0} تقييم)
                          </span>
                        </div>
                      )}

                      {offer.message && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">{offer.message}</p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void handleAcceptOffer(offer.id)}
                          disabled={acceptOffer.isPending}
                          className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-diyar-brown transition-colors cursor-pointer disabled:opacity-60"
                        >
                          قبول العرض
                        </button>
                        <Link
                          to="/chat"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          محادثة
                        </Link>
                      </div>
                    </div>

                    <div className="md:w-52 shrink-0 bg-linear-to-br from-gray-50 to-white rounded-2xl p-5 flex flex-col justify-center items-center border border-gray-100 gap-4 shadow-inner">
                      <div className="text-center">
                        <span className="block text-xs text-gray-500 mb-1">السعر المقترح</span>
                        <span className="block text-2xl font-bold text-diyar-dark tabular-nums">
                          {offer.proposed_price} {offer.currency}
                        </span>
                      </div>
                      {offer.duration_days != null && (
                        <>
                          <div className="h-px w-full bg-gray-200" />
                          <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">مدة التنفيذ</span>
                            <span className="block font-bold text-gray-800">
                              {offer.duration_days} يوم
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            طلبات الخدمات والصيانة
          </h1>
          <p className="text-gray-500">
            تابع طلباتك الخاصة، واطلع على عروض مزودي الخدمة الجاهزة للتنفيذ.
          </p>
        </div>
        <Link
          to="/services"
          className="bg-diyar-brown text-white px-6 py-3 rounded-full font-bold hover:bg-diyar-dark transition-colors flex items-center justify-center gap-2 w-full md:w-auto shrink-0 shadow-sm hover:shadow-md cursor-pointer"
        >
          <Plus size={20} /> طلب تنفيذ
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'بانتظار العروض' },
          { key: 'offers_received', label: 'عروض واردة' },
          { key: 'in_progress', label: 'قيد التنفيذ' },
          { key: 'completed', label: 'مكتملة' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-diyar-dark text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <LoadingState className="min-h-64" />
      ) : listQuery.isError ? (
        <ErrorState
          message="تعذر تحميل الطلبات"
          error={listQuery.error as Error}
          onRetry={() => void listQuery.refetch()}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات بعد"
          description="قدّم طلب تنفيذ مخصص من صفحة الخدمات."
        />
      ) : (
        <>
          <div className="space-y-4 text-right">
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
