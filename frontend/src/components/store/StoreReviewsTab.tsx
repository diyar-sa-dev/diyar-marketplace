import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StarRating } from '../product/StarRating.tsx';
import { UserAvatar } from '../profile/UserAvatar.tsx';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingState } from '../common/LoadingState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { VendorReplyBlock } from '../reviews/VendorReplyBlock.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useStoreReviews } from '../../hooks/storeReview/useStoreReviews.ts';
import type { StoreReview, StoreReviewSummary } from '../../api/storeReviews.ts';
import type { Locale } from '../../lib/i18n/types.ts';

const MAX_COMMENT_LENGTH = 2000;

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
  summary: StoreReviewSummary;
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
              ? t('storeReviews.overallRatingCount', { count: summary.review_count })
              : t('storeReviews.comingSoon')}
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
  storeName,
  storeLogoUrl,
}: {
  review: StoreReview;
  t: (key: string) => string;
  locale: Locale;
  storeName?: string;
  storeLogoUrl?: string | null;
}) {
  const displayDate = formatReviewDate(review.created_at, locale);

  return (
    <article className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
      <UserAvatar name={review.author_name} avatarUrl={review.author_avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h4 className="font-bold text-diyar-dark text-sm sm:text-base truncate">
              {review.author_name ?? t('storeReviews.anonymous')}
            </h4>
            {displayDate && (
              <time dateTime={review.created_at} className="text-xs text-gray-400 tabular-nums">
                {displayDate}
              </time>
            )}
          </div>
          <StarRating value={review.rating} readOnly size={14} />
        </div>
        {review.comment && (
          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        )}
        {review.vendor_reply && (
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
        )}
      </div>
    </article>
  );
}

interface StoreReviewsTabProps {
  slug: string;
  storeName?: string;
  storeLogoUrl?: string | null;
}

export function StoreReviewsTab({ slug, storeName, storeLogoUrl }: StoreReviewsTabProps) {
  const { t, locale } = useLocale();
  const [page, setPage] = useState(1);
  const perPage = 5;
  const { data, isLoading, isError, error, refetch } = useStoreReviews(slug, page, perPage);

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
        <h3 className="font-bold text-lg text-diyar-dark mb-4">{t('storeReviews.title')}</h3>

        {reviews.length === 0 ? (
          <EmptyState
            title={t('storeReviews.emptyTitle')}
            description={t('storeReviews.emptyDescription')}
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                t={t}
                locale={locale}
                storeName={storeName}
                storeLogoUrl={storeLogoUrl}
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

export { MAX_COMMENT_LENGTH };
