import { useState } from 'react';
import { StarRating } from '../product/StarRating.tsx';
import { UserAvatar } from '../profile/UserAvatar.tsx';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingState } from '../common/LoadingState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { VendorReplyBlock } from '../reviews/VendorReplyBlock.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useProviderReviews } from '../../hooks/provider/useProviderReviews.ts';
import type { ProviderReview, ProviderReviewSummary } from '../../api/providerReviews.ts';
import type { Locale } from '../../lib/i18n/types.ts';

function formatReviewDate(iso: string | undefined, locale: Locale): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(iso));
}

function RatingOverview({
  summary,
  t,
}: {
  summary: ProviderReviewSummary;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const hasReviews = summary.review_count > 0;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="text-center md:border-e md:border-gray-150 py-2">
          <p className="text-5xl font-extrabold text-diyar-dark mb-2">
            {hasReviews ? summary.average_rating?.toFixed(1) : '—'}
          </p>
          <div className="flex justify-center gap-1 text-amber-400 mb-2">
            <StarRating value={summary.average_rating ?? 0} readOnly size={18} />
          </div>
          <p className="text-gray-500 text-xs">
            {hasReviews
              ? t('providerReviews.overallRatingCount', { count: summary.review_count })
              : t('providerReviews.emptyTitle')}
          </p>
        </div>

        <div className="col-span-2 space-y-2">
          {summary.distribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-bold shrink-0 w-3">{item.stars}</span>
              <span className="text-amber-400 text-xs shrink-0">★</span>
              <div className="grow bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 shrink-0 w-10 text-start tabular-nums">
                {item.percentage}%
              </span>
              <span className="text-xs text-gray-400 shrink-0 w-12 hidden sm:inline tabular-nums">
                ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  t,
  locale,
  providerName,
  providerAvatarUrl,
}: {
  review: ProviderReview;
  t: (key: string) => string;
  locale: Locale;
  providerName?: string;
  providerAvatarUrl?: string | null;
}) {
  const displayDate = formatReviewDate(review.created_at, locale);
  const customerName = review.customer?.name ?? t('providerReviews.anonymous');

  return (
    <article className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
      <UserAvatar name={customerName} avatarUrl={review.customer?.avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h4 className="font-bold text-diyar-dark text-sm sm:text-base truncate">
              {customerName}
            </h4>
            {review.service?.title && (
              <p className="text-xs text-gray-400 truncate">{review.service.title}</p>
            )}
            {displayDate && (
              <time dateTime={review.created_at} className="text-xs text-gray-400 tabular-nums">
                {displayDate}
              </time>
            )}
          </div>
          <StarRating value={review.rating} readOnly size={14} />
        </div>
        {review.title && <p className="text-sm font-bold text-diyar-dark mb-1">{review.title}</p>}
        {review.comment && (
          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        )}
        {review.provider_response && (
          <div className="mt-4">
            <VendorReplyBlock
              reply={review.provider_response}
              repliedBy={review.provider_responded_by ?? providerName}
              repliedAt={review.provider_responded_at}
              avatarUrl={providerAvatarUrl}
              locale={locale}
              t={t}
              variant="provider"
              compact
            />
          </div>
        )}
      </div>
    </article>
  );
}

interface ProviderReviewsTabProps {
  slug: string;
  providerName?: string;
  providerAvatarUrl?: string | null;
}

export function ProviderReviewsTab({
  slug,
  providerName,
  providerAvatarUrl,
}: ProviderReviewsTabProps) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(1);
  const perPage = 5;
  const { data, isLoading, isError, error, refetch } = useProviderReviews(slug, page, perPage);

  if (isLoading) {
    return <LoadingState className="min-h-64" />;
  }

  if (isError) {
    return <ErrorState error={error as Error} onRetry={() => void refetch()} />;
  }

  const summary = data?.summary ?? {
    average_rating: null,
    review_count: 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 })),
  };
  const reviews = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <RatingOverview summary={summary} t={t} />

      <div>
        <h3 className="font-bold text-lg text-diyar-dark mb-4">{t('providerReviews.title')}</h3>

        {reviews.length === 0 ? (
          <EmptyState
            title={t('providerReviews.emptyTitle')}
            description={t('providerReviews.emptyDescription')}
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                t={t}
                locale={locale}
                providerName={providerName}
                providerAvatarUrl={providerAvatarUrl}
              />
            ))}
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <PaginationBar
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            className="mt-6"
          />
        )}
      </div>
    </div>
  );
}
