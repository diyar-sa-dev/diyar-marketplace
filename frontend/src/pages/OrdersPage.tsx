import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, ShieldCheck, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/checkout/useCheckout.ts';
import { useOrderPayment } from '../hooks/payment/usePayment.ts';
import { fetchPaymentCallback } from '../api/payment.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePaginationState } from '../hooks/usePaginationState.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  paymentOutcomeToHighlightTone,
  showPaymentOutcomeAlert,
  type PaymentOutcome,
} from '../lib/paymentOutcomeAlert.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { ReturnStatusBadge } from '../components/orders/ReturnStatusBadge.tsx';
import {
  OrderLineItemThumb,
  ShipmentProgressSteps,
  orderStatusBadgeKey,
  resolveShipmentProgress,
  shipmentStatusKey,
} from '../components/orders/OrderShipmentCard.tsx';
import { formatOrderDate } from '../lib/formatOrderDate.ts';
import {
  orderNeedsPayment as checkOrderNeedsPayment,
  orderPaymentCancelled,
  orderPaymentPaid as checkOrderPaymentPaid,
  resolveEffectiveOrderStatus,
} from '../lib/orderStatusUtils.ts';
import type { Order, VendorOrder, OrderItem } from '../types/order.ts';
import type { ReturnRequest } from '../types/return.ts';
import { CustomerReturnModal } from '../components/orders/CustomerReturnModal.tsx';
import { StoreReviewPrompt } from '../components/orders/StoreReviewPrompt.tsx';
import { useOrderStoreReviewEligibility } from '../hooks/storeReview/useStoreReviews.ts';
import { customerReturnKeys, useCustomerReturns } from '../hooks/returns/useCustomerReturns.ts';
import { CustomerServiceBookingsPanel } from '../components/customer/CustomerServiceBookingsPanel.tsx';
import { CustomerB2bLeadsPanel } from '../components/customer/CustomerB2bLeadsPanel.tsx';
import type { StoreReviewEligibilityItem } from '../api/storeReviews.ts';

type OrdersHubTab = 'orders' | 'bookings' | 'returns' | 'b2b';

function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  const badgeKey = orderStatusBadgeKey(status);
  const styles =
    badgeKey === 'completed'
      ? 'bg-green-100 text-green-800 border-green-200'
      : badgeKey === 'cancelled'
        ? 'bg-red-100 text-red-700 border-red-200'
        : badgeKey === 'inDelivery'
          ? 'bg-amber-100 text-amber-900 border-amber-200'
          : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${styles}`}
    >
      {label}
    </span>
  );
}

function VendorShipmentBlock({
  vendorOrder,
  t,
  onReturnRequested,
  reviewEligibility,
  orderId,
  orderNumber,
  skippedReviewIds,
  onSkipReview,
  onReviewSubmitted,
}: {
  vendorOrder: VendorOrder;
  t: ReturnType<typeof useLocale>['t'];
  onReturnRequested?: () => void;
  reviewEligibility?: StoreReviewEligibilityItem;
  orderId?: string;
  orderNumber?: string | null;
  skippedReviewIds?: Set<string>;
  onSkipReview?: (vendorOrderId: string) => void;
  onReviewSubmitted?: () => void;
}) {
  const shipmentStatus = vendorOrder.shipment?.status;
  const progress = resolveShipmentProgress(shipmentStatus, vendorOrder.status);
  const statusLabel = t(`orders.shipment.${shipmentStatusKey(shipmentStatus, vendorOrder.status)}`);
  const vendorName = vendorOrder.vendor_name ?? '—';

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-bold text-diyar-dark">
            {t('orders.shipmentLabel', { vendor: vendorName })}
          </h4>
          <p className="text-sm font-bold text-diyar-brown mt-1">{statusLabel}</p>
        </div>
        <div className="text-start">
          <p className="text-xs text-gray-500">{t('orders.trackingNumber')}</p>
          <p className="text-sm font-bold text-diyar-dark tabular-nums">
            {vendorOrder.shipment?.tracking_number ?? t('orders.trackingPending')}
          </p>
        </div>
      </div>

      {vendorOrder.status !== 'cancelled' && shipmentStatus !== 'cancelled' && (
        <ShipmentProgressSteps
          activeStep={progress}
          labels={[
            t('orders.progress.prepare'),
            t('orders.progress.ship'),
            t('orders.progress.deliver'),
          ]}
        />
      )}

      <div className="mt-5 space-y-3 pt-4 border-t border-gray-200/80">
        {(vendorOrder.items ?? []).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <OrderLineItemThumb item={item} productFallback={t('cart.sidebar.productFallback')} />
            {vendorOrder.status === 'delivered' && (
              <ReturnItemButton
                vendorOrder={vendorOrder}
                item={item}
                t={t}
                onReturnRequested={onReturnRequested}
              />
            )}
          </div>
        ))}
      </div>

      {reviewEligibility &&
        orderId &&
        vendorOrder.status === 'delivered' &&
        !skippedReviewIds?.has(vendorOrder.id) && (
          <StoreReviewPrompt
            orderId={orderId}
            orderNumber={orderNumber}
            eligibility={reviewEligibility}
            onSkipped={() => onSkipReview?.(vendorOrder.id)}
            onSubmitted={onReviewSubmitted}
          />
        )}
    </div>
  );
}

function ReturnItemButton({
  vendorOrder,
  item,
  t,
  onReturnRequested,
}: {
  vendorOrder: VendorOrder;
  item: OrderItem;
  t: ReturnType<typeof useLocale>['t'];
  onReturnRequested?: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-diyar-brown px-3 py-1.5 text-xs font-bold text-diyar-brown hover:bg-amber-50 cursor-pointer transition-colors"
      >
        <RotateCcw size={14} />
        {t('returns.requestReturn')}
      </button>
      <CustomerReturnModal
        open={open}
        vendorOrder={vendorOrder}
        item={item}
        onClose={() => setOpen(false)}
        onSubmitted={() => {
          toast.success(t('returns.requestSubmitted'));
          onReturnRequested?.();
        }}
        onError={(message) => toast.error(message)}
      />
    </>
  );
}

function CustomerReturnCard({
  item,
  t,
  locale,
}: {
  item: ReturnRequest;
  t: ReturnType<typeof useLocale>['t'];
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{item.reference}</p>
          <h3 className="font-bold text-diyar-dark">
            {item.order_number ?? item.order_id}
            {item.vendor_name ? ` · ${item.vendor_name}` : ''}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {item.created_at ? formatOrderDate(item.created_at, locale) : '—'}
          </p>
        </div>
        <ReturnStatusBadge
          status={item.status}
          label={t(`returns.status.${item.status}` as 'returns.status.requested')}
        />
      </div>

      {item.items && item.items.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
          {item.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="text-gray-700">{line.product_name ?? line.order_item_id}</span>
              <span className="font-bold tabular-nums text-diyar-dark">× {line.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function OrderCard({
  order,
  highlighted,
  highlightTone,
  t,
  locale,
  dir,
  onReturnRequested,
}: {
  order: Order;
  highlighted: boolean;
  highlightTone?: 'success' | 'failed' | 'expired' | null;
  t: ReturnType<typeof useLocale>['t'];
  locale: ReturnType<typeof useLocale>['locale'];
  dir: ReturnType<typeof useLocale>['dir'];
  onReturnRequested?: () => void;
}) {
  const hasDeliveredVendor = (order.vendor_orders ?? []).some((vo) => vo.status === 'delivered');
  const eligibilityQuery = useOrderStoreReviewEligibility(order.id, hasDeliveredVendor);
  const [skippedReviewIds, setSkippedReviewIds] = useState<Set<string>>(() => new Set());

  const eligibilityByVendorOrderId = new Map(
    (eligibilityQuery.data ?? []).map((item) => [item.vendor_order_id, item]),
  );

  const effectiveStatus = resolveEffectiveOrderStatus(order);
  const badgeKey = orderStatusBadgeKey(effectiveStatus);
  const statusLabel =
    badgeKey === 'inDelivery'
      ? t('orders.statuses.inDelivery')
      : t(`orders.statuses.${effectiveStatus as 'pending' | 'completed' | 'cancelled'}`);

  const showPaymentSuccessBanner =
    checkOrderPaymentPaid(order) || (highlightTone === 'success' && highlighted);
  const isCancelled = orderPaymentCancelled(order);

  const highlightClass =
    highlightTone === 'success'
      ? 'order-card-highlight--success'
      : highlightTone === 'failed'
        ? 'order-card-highlight--failed'
        : highlightTone === 'expired'
          ? 'order-card-highlight--expired'
          : highlighted
            ? 'border-diyar-brown ring-2 ring-diyar-brown/30'
            : 'border-gray-100';

  return (
    <article
      id={`order-${order.id}`}
      dir={dir}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ring-offset-2 ${highlightClass}`}
    >
      <div className="p-5 md:p-6 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('orders.orderNumber')}</p>
            <p className="text-lg font-bold text-diyar-dark tabular-nums">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('orders.orderDate')}</p>
            <p className="text-sm font-medium text-gray-700">
              {formatOrderDate(order.created_at, locale)}
            </p>
          </div>
          {checkOrderNeedsPayment(order) && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{t('orders.orderTotal')}</p>
              <p className="text-base font-extrabold text-diyar-dark tabular-nums">
                {order.payment?.amount ?? order.grand_total}{' '}
                <span className="text-sm font-bold text-diyar-brown">
                  {order.payment?.currency ?? t('common.currency')}
                </span>
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <OrderStatusBadge status={effectiveStatus} label={statusLabel} />
          {checkOrderNeedsPayment(order) && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {t('orders.awaitingPayment')}
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
              {t('orders.paymentCancelledBadge')}
            </span>
          )}
          {showPaymentSuccessBanner && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
              <CheckCircle2 size={12} strokeWidth={2.5} />
              {t('orders.paymentPaidBadge')}
            </span>
          )}
        </div>
      </div>

      {showPaymentSuccessBanner && (
        <div className="px-5 md:px-6 py-4 border-b border-green-100 bg-linear-to-l from-green-50 via-white to-white payment-success-banner">
          <div className="rounded-xl border border-green-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-600/20">
                <CheckCircle2 size={20} strokeWidth={2.25} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-900">
                  {t('orders.paymentSuccessBannerTitle')}
                </p>
                <p className="text-xs text-green-800/80 mt-1 leading-relaxed">
                  {t('orders.paymentSuccessBannerHint')}
                </p>
                <p className="text-sm font-extrabold text-diyar-dark mt-2 tabular-nums">
                  {order.payment?.amount ?? order.grand_total}{' '}
                  <span className="text-xs font-bold text-diyar-brown">
                    {order.payment?.currency ?? t('common.currency')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkOrderNeedsPayment(order) && (
        <div className="px-5 md:px-6 py-4 border-b border-amber-100 bg-linear-to-l from-amber-50 via-white to-white">
          <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-diyar-dark text-white">
                <ShieldCheck size={20} strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-bold text-diyar-dark">{t('orders.paymentDueTitle')}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {t('orders.paymentDueHint')}
                </p>
              </div>
            </div>
            <Link
              to={`/checkout/payment/${order.id}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-diyar-brown text-white text-sm font-extrabold px-6 py-3 hover:bg-[#A67B5B] transition shadow-md shadow-diyar-brown/15"
            >
              <CreditCard size={18} />
              {t('orders.payOrder')}
            </Link>
          </div>
        </div>
      )}

      <div className="p-5 md:p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-600">{t('orders.shipmentsByVendor')}</h3>

        {(order.vendor_orders ?? []).map((vendorOrder) => (
          <VendorShipmentBlock
            key={vendorOrder.id}
            vendorOrder={vendorOrder}
            t={t}
            onReturnRequested={onReturnRequested}
            reviewEligibility={eligibilityByVendorOrderId.get(vendorOrder.id)}
            orderId={order.id}
            orderNumber={order.order_number}
            skippedReviewIds={skippedReviewIds}
            onSkipReview={(vendorOrderId) =>
              setSkippedReviewIds((prev) => new Set(prev).add(vendorOrderId))
            }
            onReviewSubmitted={() => void eligibilityQuery.refetch()}
          />
        ))}
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as OrdersHubTab) || 'orders';
  const {
    page: ordersPage,
    perPage: ordersPerPage,
    perPageOptions: ordersPerPageOptions,
    onPageChange: onOrdersPageChange,
    onPerPageChange: onOrdersPerPageChange,
  } = usePaginationState();
  const {
    page: returnsPage,
    perPage: returnsPerPage,
    perPageOptions: returnsPerPageOptions,
    onPageChange: onReturnsPageChange,
    onPerPageChange: onReturnsPerPageChange,
  } = usePaginationState();
  const highlightId = searchParams.get('highlight');
  const paymentOutcome = searchParams.get('payment');
  const paymentCallback = paymentOutcome === 'callback';
  const highlightRef = useRef<string | null>(null);
  const callbackHandledRef = useRef(false);
  const [highlightTone, setHighlightTone] = useState<'success' | 'failed' | 'expired' | null>(null);
  const { data, isLoading, isError, error, refetch } = useOrders(ordersPage, ordersPerPage);
  const returnsQuery = useCustomerReturns(returnsPage, returnsPerPage);
  const paymentPoll = useOrderPayment(highlightId ?? '', paymentCallback && Boolean(highlightId));

  const handleReturnSubmitted = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: customerReturnKeys.all });
  };

  const resolveOrderNumber = (orderId: string | null | undefined) =>
    data?.orders?.find((order) => order.id === orderId)?.order_number;

  const presentPaymentOutcome = (outcome: PaymentOutcome, orderId: string | null | undefined) => {
    setHighlightTone(paymentOutcomeToHighlightTone(outcome));
    void showPaymentOutcomeAlert(t, outcome, resolveOrderNumber(orderId)).then(() => {
      window.setTimeout(() => setHighlightTone(null), 5000);
    });
  };

  useEffect(() => {
    if (!paymentCallback || !highlightId || callbackHandledRef.current) {
      return;
    }

    callbackHandledRef.current = true;

    void (async () => {
      try {
        await fetchPaymentCallback(highlightId);
      } catch {
        // Callback is informational; polling authoritative payment status below.
      }
    })();
  }, [paymentCallback, highlightId]);

  useEffect(() => {
    if (!paymentCallback || !highlightId) {
      return;
    }

    const status = paymentPoll.data?.status;
    if (status === 'paid') {
      const noticeKey = `diyar:payment-callback-notice:${highlightId}:paid`;
      if (sessionStorage.getItem(noticeKey)) {
        return;
      }
      sessionStorage.setItem(noticeKey, '1');
      presentPaymentOutcome('paid', highlightId);
      void refetch();
    } else if (status === 'failed') {
      const noticeKey = `diyar:payment-callback-notice:${highlightId}:failed`;
      if (sessionStorage.getItem(noticeKey)) {
        return;
      }
      sessionStorage.setItem(noticeKey, '1');
      presentPaymentOutcome('failed', highlightId);
    } else if (status === 'cancelled' || status === 'expired') {
      const noticeKey = `diyar:payment-callback-notice:${highlightId}:expired`;
      if (sessionStorage.getItem(noticeKey)) {
        return;
      }
      sessionStorage.setItem(noticeKey, '1');
      presentPaymentOutcome('expired', highlightId);
    } else if (!paymentPoll.isLoading && status === 'pending') {
      toast.info(t('orders.paymentPendingVerification'));
    }
  }, [
    paymentCallback,
    highlightId,
    paymentPoll.data?.status,
    paymentPoll.isLoading,
    refetch,
    t,
    toast,
    data?.orders,
  ]);

  useEffect(() => {
    if (!paymentOutcome || !['paid', 'failed', 'expired'].includes(paymentOutcome)) {
      return;
    }

    const noticeKey = `diyar:payment-notice:${highlightId ?? 'all'}:${paymentOutcome}`;
    const cleanPath = highlightId ? `/orders?highlight=${highlightId}` : '/orders';

    if (sessionStorage.getItem(noticeKey)) {
      if (searchParams.has('payment')) {
        navigate(cleanPath, { replace: true });
      }
      return;
    }

    sessionStorage.setItem(noticeKey, '1');

    presentPaymentOutcome(paymentOutcome as PaymentOutcome, highlightId);

    void refetch();
    navigate(cleanPath, { replace: true });
  }, [paymentOutcome, highlightId, navigate, refetch, searchParams, t, data?.orders]);

  const orders = data?.orders ?? [];

  const setActiveTab = (tab: OrdersHubTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'orders') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const hubTitle =
    activeTab === 'bookings'
      ? t('orders.tabs.bookings')
      : activeTab === 'returns'
        ? t('orders.tabs.returns')
        : activeTab === 'b2b'
          ? t('orders.tabs.b2b')
          : t('orders.title');

  const hubSubtitle =
    activeTab === 'bookings'
      ? t('orders.tabsSubtitle.bookings')
      : activeTab === 'returns'
        ? t('orders.tabsSubtitle.returns')
        : activeTab === 'b2b'
          ? t('orders.tabsSubtitle.b2b')
          : t('orders.subtitle');

  useEffect(() => {
    if (!highlightId || highlightRef.current === highlightId) {
      return;
    }

    highlightRef.current = highlightId;
    const timer = window.setTimeout(() => {
      const targetId = activeTab === 'b2b' ? `b2b-lead-${highlightId}` : `order-${highlightId}`;
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [highlightId, data, activeTab]);

  if (activeTab === 'orders' && isLoading) {
    return <LoadingState message={t('orders.loading')} />;
  }

  if (activeTab === 'orders' && isError) {
    return <ErrorState error={error} title={t('orders.error')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
      <div className="bg-diyar-dark text-white py-8 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{hubTitle}</h1>
          <p className="text-diyar-cream/80 text-sm mb-6">{hubSubtitle}</p>
          <div className="flex flex-wrap gap-2">
            {(['orders', 'bookings', 'returns', 'b2b'] as OrdersHubTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-diyar-dark shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {t(`orders.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {activeTab === 'bookings' && <CustomerServiceBookingsPanel embedded />}

        {activeTab === 'b2b' && <CustomerB2bLeadsPanel highlightId={highlightId} />}

        {activeTab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <EmptyState
                title={t('orders.emptyTitle')}
                description={t('orders.emptyDescription')}
                action={
                  <Link to="/" className="text-diyar-brown font-bold hover:text-diyar-dark">
                    {t('orders.shopNow')}
                  </Link>
                }
              />
            ) : (
              <>
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    highlighted={highlightId === order.id}
                    highlightTone={highlightId === order.id ? highlightTone : null}
                    t={t}
                    locale={locale}
                    dir={dir}
                    onReturnRequested={handleReturnSubmitted}
                  />
                ))}
                {data?.pagination && (
                  <PaginationBar
                    pagination={data.pagination}
                    page={ordersPage}
                    perPage={ordersPerPage}
                    perPageOptions={[...ordersPerPageOptions]}
                    onPageChange={onOrdersPageChange}
                    onPerPageChange={onOrdersPerPageChange}
                    alwaysShow={data.pagination.total > 0}
                    className="pt-4"
                  />
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'returns' && (
          <section>
            {returnsQuery.isLoading ? (
              <LoadingState className="min-h-32" />
            ) : returnsQuery.isError ? (
              <ErrorState
                title={t('orders.myReturnsError')}
                error={returnsQuery.error as Error}
                onRetry={() => void returnsQuery.refetch()}
              />
            ) : (returnsQuery.data?.returns ?? []).length === 0 ? (
              <EmptyState
                title={t('orders.myReturnsEmpty')}
                description={t('orders.myReturnsEmptyHint')}
              />
            ) : (
              <div className={`space-y-4 ${returnsQuery.isFetching ? 'opacity-70' : ''}`}>
                {(returnsQuery.data?.returns ?? []).map((item) => (
                  <CustomerReturnCard key={item.id} item={item} t={t} locale={locale} />
                ))}
                {returnsQuery.data?.pagination && (
                  <PaginationBar
                    pagination={returnsQuery.data.pagination}
                    page={returnsPage}
                    perPage={returnsPerPage}
                    perPageOptions={[...returnsPerPageOptions]}
                    onPageChange={onReturnsPageChange}
                    onPerPageChange={onReturnsPerPageChange}
                    alwaysShow={returnsQuery.data.pagination.total > 0}
                  />
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
