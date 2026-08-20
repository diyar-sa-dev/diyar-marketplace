import React, { useState } from 'react';
import { Loader2, MessageSquare, Star, X } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { StarRating } from '../../components/product/StarRating.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { VendorReplyBlock } from '../../components/reviews/VendorReplyBlock.tsx';
import {
  useReplyVendorReview,
  useVendorReviewInbox,
} from '../../hooks/vendor/useVendorReviewInbox.ts';
import { useVendorSettings } from '../../hooks/vendor/useVendorSettings.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import { useToast } from '../../hooks/useToast.ts';
import { formatRelativeReviewDate } from '../../lib/formatRelativeReviewDate.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { VendorInboxReview } from '../../api/vendorReviewInbox.ts';

export default function VendorReviewsInbox() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState();
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'store'>('all');
  const [replyTarget, setReplyTarget] = useState<VendorInboxReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const type = typeFilter === 'all' ? undefined : typeFilter;
  const inboxQuery = useVendorReviewInbox(page, perPage, type);
  const { data: settings } = useVendorSettings();
  const replyReview = useReplyVendorReview();

  const storeLogoUrl = resolveMediaUrl(settings?.logo_url);
  const storeName = settings?.business_name ?? '';

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) {
      return;
    }

    try {
      await replyReview.mutateAsync({
        type: replyTarget.type,
        reviewId: replyTarget.id,
        reply: replyText.trim(),
      });
      toast.success(t('vendor.reviewsInbox.replySuccess'));
      setReplyTarget(null);
      setReplyText('');
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  if (inboxQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (inboxQuery.isError) {
    return (
      <ErrorState
        message={t('vendor.reviewsInbox.loadError')}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const items = inboxQuery.data?.items ?? [];
  const pagination = inboxQuery.data?.pagination;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.reviewsInbox.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('vendor.reviewsInbox.subtitle')}</p>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {(['all', 'product', 'store'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setTypeFilter(filter);
                resetPage();
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                typeFilter === filter
                  ? 'bg-gray-100 text-diyar-dark font-bold'
                  : 'text-gray-500 hover:text-diyar-dark'
              }`}
            >
              {t(`vendor.reviewsInbox.filters.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('vendor.reviewsInbox.emptyTitle')}
          description={t('vendor.reviewsInbox.emptyDescription')}
        />
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
            <article
              key={`${review.type}-${review.id}`}
              className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-in fade-in duration-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      review.type === 'product'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {review.type === 'product' ? <Star size={12} /> : <MessageSquare size={12} />}
                    {t(`vendor.reviewsInbox.types.${review.type}`)}
                  </span>
                  {review.target_label ? (
                    <span className="text-sm font-bold text-diyar-dark">{review.target_label}</span>
                  ) : null}
                </div>
                <time
                  dateTime={review.created_at ?? undefined}
                  className="text-xs text-gray-400 tabular-nums shrink-0"
                  dir="ltr"
                >
                  {formatRelativeReviewDate(review.created_at, locale)}
                </time>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <UserAvatar
                  name={review.customer_name}
                  avatarUrl={review.customer_avatar_url}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-diyar-dark text-sm">
                      {review.customer_name ?? t('catalog.productDetail.anonymousReviewer')}
                    </span>
                    <StarRating value={review.rating} readOnly size={16} />
                  </div>
                </div>
              </div>

              {review.comment ? (
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                  {review.comment}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {t('vendor.reviewsInbox.ratingOnly')}
                </p>
              )}

              {review.vendor_reply ? (
                <div className="mt-4">
                  <VendorReplyBlock
                    reply={review.vendor_reply}
                    repliedBy={review.vendor_replied_by ?? storeName}
                    repliedAt={review.vendor_replied_at}
                    avatarUrl={storeLogoUrl}
                    locale={locale}
                    t={t}
                    compact
                  />
                </div>
              ) : review.can_reply ? (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTarget(review);
                    setReplyText('');
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-diyar-brown/20 text-diyar-brown text-sm font-bold hover:bg-diyar-cream/40 transition cursor-pointer"
                >
                  <MessageSquare size={16} />
                  {t('vendor.reviewsInbox.reply')}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {pagination ? (
        <PaginationBar
          pagination={{
            current_page: pagination.current_page,
            last_page: pagination.last_page,
            per_page: pagination.per_page,
            total: pagination.total,
          }}
          page={page}
          perPage={perPage}
          perPageOptions={[...perPageOptions]}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          alwaysShow={pagination.total > 0}
        />
      ) : null}

      {replyTarget ? (
        <div
          className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4"
          onClick={() => setReplyTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            dir={dir}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">
                {t('vendor.reviewsInbox.replyTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={5}
                placeholder={t('vendor.reviewsInbox.replyPlaceholder')}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-diyar-brown focus:outline-none focus:ring-1 focus:ring-diyar-brown resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleReply()}
                disabled={replyReview.isPending || replyText.trim().length < 2}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-diyar-brown text-white hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {replyReview.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('vendor.reviewsInbox.replySending')}
                  </>
                ) : (
                  t('vendor.reviewsInbox.replySend')
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
