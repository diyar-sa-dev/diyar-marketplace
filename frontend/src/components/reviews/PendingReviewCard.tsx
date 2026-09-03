import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { StarRating } from '../product/StarRating.tsx';
import { ReviewTypeBadge } from './ReviewTypeBadge.tsx';
import { validateStoreReviewInput, MAX_COMMENT_LENGTH } from '../../lib/storeReviewValidation.ts';
import { submitProductReview } from '../../api/productEngagement.ts';
import { submitStoreReview } from '../../api/storeReviews.ts';
import { submitProviderReview } from '../../api/providerReviews.ts';
import { submitB2bCompanyReview } from '../../api/b2bReviews.ts';
import { showErrorAlert, showSuccessToast } from '../../lib/confirmDialog.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import { customerReviewSubjectImage, customerReviewSubjectTitle, customerReviewServiceSource } from '../../lib/customerReviewSubject.ts';
import type { PendingCustomerReview } from '../../api/customerReviews.ts';

interface PendingReviewCardProps {
  item: PendingCustomerReview;
  t: (key: string) => string;
  onSkipped: () => void;
  onSubmitted: () => void;
}

export function PendingReviewCard({ item, t, onSkipped, onSubmitted }: PendingReviewCardProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isProduct = item.type === 'product';
  const isService = item.type === 'service';
  const isB2b = item.type === 'b2b';
  const untitled =
    isProduct
      ? t('customerReviews.typeProduct')
      : isService
        ? t('serviceBookings.defaultServiceTitle')
        : isB2b
          ? t('customerReviews.typeB2b')
          : t('customerReviews.typeStore');
  const title = customerReviewSubjectTitle(item, untitled);
  const imageUrl = customerReviewSubjectImage(item);

  const serviceSource = customerReviewServiceSource(item);
  const rateLabel = isProduct
    ? t('customerReviews.rateProduct')
    : isService
      ? serviceSource === 'rfq'
        ? t('customerReviews.rateServiceRequest')
        : t('customerReviews.rateService')
      : isB2b
        ? t('customerReviews.rateB2b')
        : t('customerReviews.rateStore');

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    const validationError = validateStoreReviewInput(rating, trimmed);
    if (validationError) {
      await showErrorAlert(t, validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (isProduct && item.product?.id) {
        await submitProductReview(item.product.id, {
          rating,
          comment: trimmed || undefined,
        });
      } else if (isService && item.booking_id) {
        await submitProviderReview(item.booking_id, {
          rating,
          comment: trimmed || undefined,
        });
      } else if (isB2b && item.company?.slug && item.b2b_lead_id) {
        await submitB2bCompanyReview(item.company.slug, {
          b2b_lead_id: item.b2b_lead_id,
          rating,
          comment: trimmed || undefined,
        });
      } else if (!isProduct && !isService && !isB2b && item.store?.slug && item.order_id) {
        await submitStoreReview(item.store.slug, {
          order_id: item.order_id,
          rating,
          comment: trimmed || undefined,
        });
      } else {
        throw new Error('missing target');
      }

      await showSuccessToast(t, 'customerReviews.submitSuccess');
      setOpen(false);
      onSubmitted();
    } catch {
      await showErrorAlert(t, 'customerReviews.submitError');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
          <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={title ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-diyar-brown/40">
                {title?.charAt(0) ?? '?'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-diyar-dark text-sm wrap-break-word">{title}</h3>
              <ReviewTypeBadge type={item.type} serviceSource={serviceSource} t={t} />
            </div>
            {'order_number' in item && item.order_number ? (
              <p className="text-xs text-gray-500">
                {t('orders.orderNumber')}: {item.order_number}
              </p>
            ) : null}
            {isService && item.request_reference ? (
              <p className="text-xs text-gray-500">
                {t('customerReviews.requestReference')}: {item.request_reference}
              </p>
            ) : null}
            {isService && item.booking_reference && (
              <p className="text-xs text-gray-500">
                {t('customerReviews.bookingReference')}: {item.booking_reference}
              </p>
            )}
            {isB2b && item.project_type ? (
              <p className="text-xs text-gray-500">
                {t('b2b.company.projectType')}: {item.project_type}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${vendorButtonClass} flex-1 sm:flex-none bg-diyar-brown text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#A67B5B] transition-colors cursor-pointer`}
          >
            {rateLabel}
          </button>
          <button
            type="button"
            onClick={onSkipped}
            className={`${vendorButtonClass} flex-1 sm:flex-none border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer`}
          >
            {t('storeReviews.skip')}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-diyar-dark wrap-break-word">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{rateLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <StarRating value={rating} onChange={setRating} size={28} className="mb-4" />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder={t('storeReviews.commentPlaceholder')}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y min-h-24"
            />

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className={`${vendorButtonClass} flex-1 bg-diyar-brown text-white py-3 rounded-xl font-bold hover:bg-[#A67B5B] disabled:opacity-60 cursor-pointer`}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  t('storeReviews.submit')
                )}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setOpen(false);
                  onSkipped();
                }}
                className={`${vendorButtonClass} px-5 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 cursor-pointer`}
              >
                {t('storeReviews.skip')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
