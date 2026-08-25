import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { StarRating } from '../components/product/StarRating.tsx';
import { ReviewTypeBadge } from '../components/reviews/ReviewTypeBadge.tsx';
import { VendorReplyBlock } from '../components/reviews/VendorReplyBlock.tsx';
import { UserAvatar } from '../components/profile/UserAvatar.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { useCustomerReviewDetail } from '../hooks/reviews/useCustomerReviewDetail.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { resolveAccountSettingsBackPath } from '../lib/auth/roles.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { formatRelativeReviewDate } from '../lib/formatRelativeReviewDate.ts';
import { resolveMediaUrl } from '../lib/media.ts';
import type { CustomerReviewType } from '../api/customerReviews.ts';

export default function CustomerReviewDetailPage() {
  const { type, id } = useParams<{ type: CustomerReviewType; id: string }>();
  const { t, locale, dir } = useLocale();
  const { user } = useAuth();
  const accountBackPath = resolveAccountSettingsBackPath(user?.roles);

  const reviewType =
    type === 'store' ? 'store' : type === 'service' ? 'service' : 'product';
  const {
    data: review,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomerReviewDetail(reviewType, id);

  if (isLoading) {
    return <LoadingState className="min-h-screen" />;
  }

  if (isError || !review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={dir}>
        <ErrorState
          message={t('customerReviews.loadError')}
          error={error as Error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const isProduct = review.type === 'product';
  const isService = review.type === 'service';
  const title = isProduct ? review.product?.name : isService ? review.service?.title : review.store?.name;
  const subjectImage = isProduct
    ? resolveMediaUrl(review.product?.image_url)
    : isService
      ? resolveMediaUrl(review.provider?.logo_url)
      : resolveMediaUrl(review.store?.logo_url);
  const storeLogo = resolveMediaUrl(isService ? review.provider?.logo_url : review.store?.logo_url);
  const subjectLink = isProduct
    ? review.product?.id && review.product.available
      ? `/products/${review.product.id}`
      : null
    : isService
      ? review.service?.slug
        ? `/service/${review.service.slug}`
        : null
      : review.store?.slug
        ? `/store/${review.store.slug}`
        : null;

  const replyText = isService ? review.provider_response : review.vendor_reply;
  const replyAuthor = isService
    ? review.provider_responded_by ?? review.provider?.name
    : review.vendor_replied_by ?? review.store?.name;
  const replyAt = isService ? review.provider_responded_at : review.vendor_replied_at;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12" dir={dir}>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link
              to="/profile/reviews"
              className="hover:text-diyar-dark transition font-bold text-diyar-brown"
            >
              ← {t('customerReviews.title')}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 text-diyar-dark">
          <MessageSquare size={20} className="text-diyar-brown" />
          <h1 className="font-bold text-lg">
            {isProduct
              ? t('customerReviews.productReviewTitle')
              : isService
                ? t('customerReviews.serviceReviewTitle')
                : t('customerReviews.storeReviewTitle')}
          </h1>
        </div>

        {subjectLink && title && (
          <Link
            to={subjectLink}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-diyar-brown/30 transition"
          >
            {subjectImage && (
              <img
                src={subjectImage}
                alt=""
                className="w-14 h-14 rounded-xl object-cover border border-gray-100"
              />
            )}
            <div>
              <p className="text-xs text-gray-500">
                {isProduct
                  ? t('customerReviews.typeProduct')
                  : isService
                    ? t('customerReviews.typeService')
                    : t('customerReviews.typeStore')}
              </p>
              <p className="font-bold text-diyar-dark">{title}</p>
            </div>
            <ChevronLeft size={18} className="ms-auto rtl:rotate-180 text-gray-400" />
          </Link>
        )}

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-bold text-diyar-dark block">
                    {user?.name ?? t('profile.memberFallback')}
                  </span>
                  <ReviewTypeBadge type={review.type} t={t} />
                </div>
                <StarRating value={review.rating} readOnly size={18} />
              </div>
              <time
                dateTime={review.created_at ?? undefined}
                className="text-xs text-gray-400 tabular-nums mt-1 block"
              >
                {formatRelativeReviewDate(review.created_at, locale)}
              </time>
            </div>
          </div>

          {review.comment ? (
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              {review.comment}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">{t('customerReviews.noComment')}</p>
          )}
        </article>

        {replyText ? (
          <VendorReplyBlock
            reply={replyText}
            repliedBy={replyAuthor}
            repliedAt={replyAt}
            avatarUrl={storeLogo ?? subjectImage}
            locale={locale}
            t={t}
            variant={isService ? 'provider' : 'vendor'}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
            {isService ? t('customerReviews.noProviderReply') : t('customerReviews.noVendorReply')}
          </p>
        )}
      </div>
    </div>
  );
}
