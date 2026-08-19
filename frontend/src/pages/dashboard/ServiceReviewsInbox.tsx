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
  useProviderReviewInbox,
  useRespondToProviderReview,
} from '../../hooks/provider/useProviderReviews.ts';
import { useProviderSettings } from '../../hooks/provider/useProviderDashboard.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { formatRelativeReviewDate } from '../../lib/formatRelativeReviewDate.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ProviderReview } from '../../api/providerReviews.ts';

export default function ServiceReviewsInbox() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState<ProviderReview | null>(null);
  const [replyText, setReplyText] = useState('');

  const inboxQuery = useProviderReviewInbox(page, 10);
  const { data: settings } = useProviderSettings();
  const replyReview = useRespondToProviderReview();

  const providerAvatar = resolveMediaUrl(settings?.profile.avatar_url);
  const providerName = settings?.profile.specialty ?? '';

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) {
      return;
    }

    try {
      await replyReview.mutateAsync({ reviewId: replyTarget.id, response: replyText.trim() });
      toast.success(t('providerDashboard.reviewsInbox.replySuccess'));
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
        message={t('providerDashboard.reviewsInbox.loadError')}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const items = inboxQuery.data?.items ?? [];
  const pagination = inboxQuery.data?.pagination;
  const summary = inboxQuery.data?.summary;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.reviewsInbox.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t('providerDashboard.reviewsInbox.subtitle')}
          </p>
        </div>
        {summary && summary.review_count > 0 && (
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
            <StarRating value={summary.average_rating ?? 0} readOnly size={16} />
            <span className="font-bold text-diyar-dark tabular-nums">
              {summary.average_rating?.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({summary.review_count} {t('providerDashboard.reviewsInbox.reviewsUnit')})
            </span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('providerDashboard.reviewsInbox.emptyTitle')}
          description={t('providerDashboard.reviewsInbox.emptyDescription')}
        />
      ) : (
        <div className="space-y-4">
          {items.map((review) => (
            <article
              key={review.id}
              className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={review.customer?.name ?? t('providerReviews.anonymous')}
                    avatarUrl={review.customer?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-diyar-dark text-sm truncate">
                      {review.customer?.name ?? t('providerReviews.anonymous')}
                    </p>
                    {review.service?.title && (
                      <p className="text-xs text-gray-400 truncate">{review.service.title}</p>
                    )}
                    {review.created_at && (
                      <time className="text-xs text-gray-400 tabular-nums">
                        {formatRelativeReviewDate(review.created_at, locale)}
                      </time>
                    )}
                  </div>
                </div>
                <StarRating value={review.rating} readOnly size={14} />
              </div>

              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.comment}</p>
              )}

              {review.provider_response ? (
                <VendorReplyBlock
                  reply={review.provider_response}
                  repliedBy={providerName}
                  repliedAt={review.provider_responded_at}
                  avatarUrl={providerAvatar}
                  locale={locale}
                  t={t}
                  variant="provider"
                  compact
                />
              ) : review.can_reply ? (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTarget(review);
                    setReplyText('');
                  }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-diyar-brown hover:text-orange-700 cursor-pointer"
                >
                  <MessageSquare size={16} /> {t('providerDashboard.reviewsInbox.reply')}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
      )}

      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-diyar-dark">
                  {t('providerDashboard.reviewsInbox.replyTitle')}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm text-gray-500">{replyTarget.rating}/5</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t('providerDashboard.reviewsInbox.replyPlaceholder')}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y min-h-24"
            />

            <button
              type="button"
              disabled={replyReview.isPending || !replyText.trim()}
              onClick={() => void handleReply()}
              className="w-full mt-4 bg-diyar-brown text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {replyReview.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                t('providerDashboard.reviewsInbox.sendReply')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
