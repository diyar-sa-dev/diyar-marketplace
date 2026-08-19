import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { PublishedReviewCard } from '../components/reviews/PublishedReviewCard.tsx';
import { PendingReviewCard } from '../components/reviews/PendingReviewCard.tsx';
import {
  useCustomerReviews,
  useInvalidateCustomerReviews,
} from '../hooks/reviews/useCustomerReviews.ts';
import { useOrders } from '../hooks/checkout/useCheckout.ts';
import { orderPaymentPaid as checkOrderPaymentPaid } from '../lib/orderStatusUtils.ts';
import { resolveAccountSettingsBackPath } from '../lib/auth/roles.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import type {
  CustomerReviewFilterType,
  CustomerReviewStatus,
  PublishedCustomerReview,
  PendingCustomerReview,
} from '../api/customerReviews.ts';

const SKIPPED_STORAGE_KEY = 'diyar:skipped-pending-reviews';

function readSkippedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SKIPPED_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function persistSkippedKeys(keys: Set<string>) {
  sessionStorage.setItem(SKIPPED_STORAGE_KEY, JSON.stringify([...keys]));
}

const TYPE_FILTERS: CustomerReviewFilterType[] = ['all', 'product', 'store', 'service'];

export default function ReviewsPage() {
  const { t, locale, dir } = useLocale();
  const { user } = useAuth();
  const accountBackPath = resolveAccountSettingsBackPath(user?.roles);
  const invalidateReviews = useInvalidateCustomerReviews();
  const [activeTab, setActiveTab] = useState<CustomerReviewStatus>('published');
  const [typeFilter, setTypeFilter] = useState<CustomerReviewFilterType>('all');
  const [page, setPage] = useState(1);
  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(() => readSkippedKeys());

  const { data, isLoading, isError, error, refetch, isFetching } = useCustomerReviews(
    activeTab,
    typeFilter,
    page,
    10,
  );
  const ordersQuery = useOrders();

  const otherStatus: CustomerReviewStatus = activeTab === 'published' ? 'pending' : 'published';
  const otherSummaryQuery = useCustomerReviews(otherStatus, 'all', 1, 1);

  const publishedCount =
    activeTab === 'published'
      ? (data?.summary.published_count ?? 0)
      : (otherSummaryQuery.data?.summary.published_count ?? 0);
  const pendingCount =
    activeTab === 'pending'
      ? (data?.summary.pending_count ?? 0)
      : (otherSummaryQuery.data?.summary.pending_count ?? 0);

  const items = useMemo(() => {
    const raw = data?.items ?? [];
    if (activeTab !== 'pending') {
      return raw;
    }
    return raw.filter((item) => {
      if (!('pending_key' in item)) {
        return true;
      }
      return !skippedKeys.has(item.pending_key);
    });
  }, [activeTab, data?.items, skippedKeys]);

  const rawPendingItems = activeTab === 'pending' ? (data?.items ?? []) : [];
  const allPendingSkipped =
    activeTab === 'pending' && rawPendingItems.length > 0 && items.length === 0;

  const hasAwaitingDelivery = useMemo(() => {
    if (activeTab !== 'pending' || pendingCount > 0) {
      return false;
    }
    return (ordersQuery.data?.orders ?? []).some(
      (order) =>
        checkOrderPaymentPaid(order) &&
        (order.vendor_orders ?? []).some(
          (vendorOrder) => vendorOrder.status !== 'delivered' && vendorOrder.status !== 'cancelled',
        ),
    );
  }, [activeTab, pendingCount, ordersQuery.data?.orders]);

  const handleSkip = (pendingKey: string) => {
    setSkippedKeys((prev) => {
      const next = new Set(prev);
      next.add(pendingKey);
      persistSkippedKeys(next);
      return next;
    });
  };

  const handleSubmitted = () => {
    invalidateReviews();
    void refetch();
    void otherSummaryQuery.refetch();
  };

  const handleTabChange = (tab: CustomerReviewStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleTypeChange = (type: CustomerReviewFilterType) => {
    setTypeFilter(type);
    setPage(1);
  };

  const emptyTitle =
    activeTab === 'published'
      ? typeFilter === 'product'
        ? t('customerReviews.emptyPublishedProduct')
        : typeFilter === 'store'
          ? t('customerReviews.emptyPublishedStore')
          : typeFilter === 'service'
            ? t('customerReviews.emptyService')
            : t('customerReviews.emptyPublished')
      : typeFilter === 'product'
        ? t('customerReviews.emptyPendingProduct')
        : typeFilter === 'store'
          ? t('customerReviews.emptyPendingStore')
          : typeFilter === 'service'
            ? t('customerReviews.emptyService')
            : t('customerReviews.emptyPending');

  const emptyDescription =
    activeTab === 'published'
      ? t('customerReviews.emptyPublishedHint')
      : allPendingSkipped
        ? t('customerReviews.allPendingSkipped')
        : hasAwaitingDelivery
          ? t('customerReviews.emptyPendingHint')
          : t('customerReviews.emptyPendingHint');

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12" dir={dir}>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">
              {t('common.home')}
            </Link>
            <ChevronLeft size={16} className="rtl:rotate-180" />
            <Link to={accountBackPath} className="hover:text-diyar-dark transition">
              {t('common.myAccount')}
            </Link>
            <ChevronLeft size={16} className="rtl:rotate-180" />
            <span className="font-bold text-diyar-dark">{t('customerReviews.title')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-1">
            {t('customerReviews.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('customerReviews.subtitle')}</p>
        </div>

        <div className="flex gap-2 mb-4 bg-gray-200/50 p-1 rounded-xl w-full sm:w-max overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('published')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'published'
                ? 'bg-white text-diyar-dark shadow-sm'
                : 'text-gray-500 hover:text-diyar-dark'
            }`}
          >
            {t('customerReviews.publishedTab', { count: publishedCount })}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('pending')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-diyar-dark shadow-sm'
                : 'text-gray-500 hover:text-diyar-dark'
            }`}
          >
            {t('customerReviews.pendingTab', { count: pendingCount })}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              disabled={type === 'service'}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                typeFilter === type
                  ? 'bg-diyar-brown text-white border-diyar-brown'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown/40'
              }`}
            >
              {t(`customerReviews.filter.${type}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState className="min-h-64" />
        ) : isError ? (
          <ErrorState
            message={t('customerReviews.loadError')}
            error={error as Error}
            onRetry={() => void refetch()}
          />
        ) : typeFilter === 'service' ? (
          <EmptyState
            title={t('customerReviews.emptyService')}
            description={t('customerReviews.serviceComingSoon')}
          />
        ) : allPendingSkipped ? (
          <EmptyState
            title={t('customerReviews.emptyPending')}
            description={t('customerReviews.allPendingSkipped')}
          />
        ) : items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className={`space-y-4 ${isFetching ? 'opacity-70' : ''}`}>
            {activeTab === 'published'
              ? (items as PublishedCustomerReview[]).map((review) => (
                  <PublishedReviewCard
                    key={`${review.type}-${review.id}`}
                    review={review}
                    t={t}
                    locale={locale}
                    onUpdated={handleSubmitted}
                  />
                ))
              : (items as PendingCustomerReview[]).map((item) => (
                  <PendingReviewCard
                    key={item.pending_key}
                    item={item}
                    t={t}
                    onSkipped={() => handleSkip(item.pending_key)}
                    onSubmitted={handleSubmitted}
                  />
                ))}

            {data?.pagination && (
              <PaginationBar
                pagination={data.pagination}
                page={page}
                onPageChange={setPage}
                className="pt-4"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
