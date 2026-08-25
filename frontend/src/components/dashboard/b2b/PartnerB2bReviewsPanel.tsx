import { Star } from 'lucide-react';
import { PaginationBar } from '../../catalog/PaginationBar.tsx';
import { EmptyState } from '../../common/EmptyState.tsx';
import { ErrorState } from '../../common/ErrorState.tsx';
import { LoadingState } from '../../common/LoadingState.tsx';
import { usePartnerB2bReviews } from '../../../hooks/b2b/usePartnerB2bReviews.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { usePaginationState } from '../../../hooks/usePaginationState.ts';
import { formatFinanceDateTime } from '../../../lib/formatFinanceDateTime.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import type { PartnerB2bPortal } from '../../../types/b2b.ts';

type PartnerB2bReviewsPanelProps = {
  portal: PartnerB2bPortal;
};

export function PartnerB2bReviewsPanel({ portal }: PartnerB2bReviewsPanelProps) {
  const { t, locale } = useLocale();
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange } = usePaginationState();
  const reviewsQuery = usePartnerB2bReviews(portal, page, perPage);

  if (reviewsQuery.isLoading) {
    return <LoadingState message={t('b2b.partner.reviews.loading')} className="min-h-48" />;
  }

  if (reviewsQuery.isError) {
    return (
      <ErrorState
        message={t('b2b.partner.reviews.loadError')}
        onRetry={() => void reviewsQuery.refetch()}
      />
    );
  }

  const items = reviewsQuery.data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title={t('b2b.partner.reviews.emptyTitle')}
        description={t('b2b.partner.reviews.emptyDescription')}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className={`space-y-3 ${reviewsQuery.isFetching ? 'opacity-70' : ''}`}>
        {items.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                {review.author_avatar_url ? (
                  <img
                    src={resolveMediaUrl(review.author_avatar_url) ?? ''}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold text-sm shrink-0">
                    {(review.author_name ?? '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-diyar-dark truncate">{review.author_name ?? '—'}</p>
                  {review.project_type ? (
                    <p className="text-xs text-gray-500 truncate">{review.project_type}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={
                      star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }
                  />
                ))}
              </div>
            </div>
            {review.comment ? (
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">{t('customerReviews.noComment')}</p>
            )}
            {review.created_at ? (
              <p className="text-[11px] text-gray-400 mt-3">
                {formatFinanceDateTime(review.created_at, locale)}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {reviewsQuery.data?.pagination ? (
        <PaginationBar
          pagination={reviewsQuery.data.pagination}
          page={page}
          perPage={perPage}
          perPageOptions={[...perPageOptions]}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          alwaysShow={reviewsQuery.data.pagination.total > 0}
        />
      ) : null}
    </section>
  );
}
