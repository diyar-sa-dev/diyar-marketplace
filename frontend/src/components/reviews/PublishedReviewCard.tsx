import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { StarRating } from '../product/StarRating.tsx';
import { ReviewTypeBadge } from './ReviewTypeBadge.tsx';
import { VendorReplyBlock } from './VendorReplyBlock.tsx';
import { formatRelativeReviewDate } from '../../lib/formatRelativeReviewDate.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { validateStoreReviewInput, MAX_COMMENT_LENGTH } from '../../lib/storeReviewValidation.ts';
import { updateProductReview, deleteProductReview } from '../../api/productEngagement.ts';
import { updateStoreReview, deleteStoreReview } from '../../api/storeReviews.ts';
import { showErrorAlert, showSuccessToast } from '../../lib/confirmDialog.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import type { PublishedCustomerReview } from '../../api/customerReviews.ts';
import type { Locale } from '../../lib/i18n/types.ts';

interface PublishedReviewCardProps {
  review: PublishedCustomerReview;
  t: (key: string) => string;
  locale: Locale;
  onUpdated?: () => void;
}

export function PublishedReviewCard({ review, t, locale, onUpdated }: PublishedReviewCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isProduct = review.type === 'product';
  const title = isProduct ? review.product?.name : review.store?.name;
  const imageUrl = isProduct
    ? resolveMediaUrl(review.product?.image_url)
    : resolveMediaUrl(review.store?.logo_url);
  const linkTarget = isProduct
    ? review.product?.id && review.product.available
      ? `/products/${review.product.id}`
      : null
    : review.store?.slug
      ? `/store/${review.store.slug}`
      : null;

  const canEdit =
    (isProduct && review.product?.id) || (!isProduct && review.store?.slug && review.id);

  const handleUpdate = async () => {
    const trimmed = comment.trim();
    const validationError = validateStoreReviewInput(rating, trimmed);
    if (validationError) {
      await showErrorAlert(t, validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (isProduct && review.product?.id) {
        await updateProductReview(review.product.id, {
          rating,
          comment: trimmed || undefined,
        });
      } else if (!isProduct) {
        await updateStoreReview(review.id, {
          rating,
          comment: trimmed || undefined,
        });
      }
      await showSuccessToast(t, 'customerReviews.updateSuccess');
      setEditOpen(false);
      onUpdated?.();
    } catch {
      await showErrorAlert(t, 'customerReviews.updateError');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('customerReviews.deleteConfirm'))) {
      return;
    }

    setDeleting(true);
    try {
      if (isProduct && review.product?.id) {
        await deleteProductReview(review.product.id);
      } else if (!isProduct) {
        await deleteStoreReview(review.id);
      }
      await showSuccessToast(t, 'customerReviews.deleteSuccess');
      onUpdated?.();
    } catch {
      await showErrorAlert(t, 'customerReviews.deleteError');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    setRating(review.rating);
    setComment(review.comment ?? '');
    setEditOpen(true);
  };

  return (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
        {linkTarget ? (
          <Link
            to={linkTarget}
            className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center cursor-pointer"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={title ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-diyar-brown/40">{title?.charAt(0) ?? '?'}</span>
            )}
          </Link>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={title ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-diyar-brown/40">{title?.charAt(0) ?? '?'}</span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {linkTarget ? (
                  <Link to={linkTarget} className="font-bold text-diyar-dark wrap-break-word hover:text-diyar-brown">
                    {title ?? '—'}
                  </Link>
                ) : (
                  <h3 className="font-bold text-diyar-dark wrap-break-word">{title ?? '—'}</h3>
                )}
                <ReviewTypeBadge type={review.type} t={t} />
              </div>
              <StarRating value={review.rating} readOnly size={14} className="mb-1" />
            </div>
            <time
              dateTime={review.created_at ?? undefined}
              className="text-xs text-gray-400 shrink-0 tabular-nums"
            >
              {formatRelativeReviewDate(review.created_at, locale)}
            </time>
          </div>

          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 wrap-break-word">
              {review.comment}
            </p>
          )}

          {review.vendor_reply && (
            <VendorReplyBlock
              reply={review.vendor_reply}
              repliedBy={review.vendor_replied_by ?? review.store?.name}
              repliedAt={review.vendor_replied_at}
              avatarUrl={review.store?.logo_url}
              locale={locale}
              t={t}
              compact
            />
          )}

          {!isProduct && review.order_number && (
            <p className="text-xs text-gray-400 mt-2">
              {t('orders.orderNumber')}: {review.order_number}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4 items-center justify-between">
            {canEdit && (
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openEdit}
                className={`${vendorButtonClass} inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer`}
              >
                <Pencil size={14} />
                {t('customerReviews.editReview')}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className={`${vendorButtonClass} inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60`}
              >
                <Trash2 size={14} />
                {deleting ? '…' : t('customerReviews.deleteReview')}
              </button>
              </div>
            )}
            <Link
              to={`/profile/reviews/${review.type}/${review.id}`}
              className={`inline-flex items-center gap-1 text-sm font-bold text-diyar-brown hover:text-[#A67B5B] ${canEdit ? 'ms-auto' : ''}`}
            >
              {t('customerReviews.viewDetail')}
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-diyar-dark wrap-break-word">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('customerReviews.editReview')}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <StarRating value={rating} onChange={setRating} size={28} className="mb-4" />

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
              rows={4}
              placeholder={t('storeReviews.commentPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-diyar-brown focus:outline-none focus:ring-1 focus:ring-diyar-brown resize-none"
            />

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                {t('vendor.finance.withdrawalCancel')}
              </button>
              <button
                type="button"
                disabled={submitting || rating < 1}
                onClick={() => void handleUpdate()}
                className={`${vendorButtonClass} px-5 py-2.5 rounded-xl bg-diyar-brown text-white font-bold hover:bg-[#A67B5B] disabled:opacity-60 cursor-pointer inline-flex items-center gap-2`}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
