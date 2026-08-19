import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StarRating } from '../product/StarRating.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useSubmitStoreReview } from '../../hooks/storeReview/useStoreReviews.ts';
import { validateStoreReviewInput, MAX_COMMENT_LENGTH } from '../../lib/storeReviewValidation.ts';
import type { StoreReviewEligibilityItem } from '../../api/storeReviews.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import { showErrorAlert, showSuccessToast } from '../../lib/confirmDialog.ts';

interface StoreReviewPromptProps {
  orderId: string;
  orderNumber?: string | null;
  eligibility: StoreReviewEligibilityItem;
  onSkipped?: () => void;
  onSubmitted?: () => void;
}

export function StoreReviewPrompt({
  orderId,
  orderNumber,
  eligibility,
  onSkipped,
  onSubmitted,
}: StoreReviewPromptProps) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const slug = eligibility.vendor_slug ?? '';

  const submitReview = useSubmitStoreReview(slug, orderId);

  useEffect(() => {
    if (eligibility.status === 'already_reviewed' && eligibility.review) {
      setRating(eligibility.review.rating);
      setComment(eligibility.review.comment ?? '');
    }
  }, [eligibility]);

  if (eligibility.status === 'not_eligible') {
    return null;
  }

  if (eligibility.status === 'already_reviewed') {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 md:p-5 mt-4">
        <p className="text-sm font-bold text-green-800 mb-2">{t('storeReviews.alreadyReviewed')}</p>
        <StarRating
          value={eligibility.review?.rating ?? rating}
          readOnly
          size={20}
          className="mb-2"
        />
        {eligibility.review?.comment && (
          <p className="text-sm text-green-900/80 leading-relaxed">{eligibility.review.comment}</p>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    const validationError = validateStoreReviewInput(rating, trimmed);
    if (validationError) {
      await showErrorAlert(t, validationError);
      return;
    }

    if (!slug) {
      await showErrorAlert(t, 'storeReviews.submitError');
      return;
    }

    try {
      await submitReview.mutateAsync({ rating, comment: trimmed || undefined });
      await showSuccessToast(t, 'storeReviews.submitSuccess');
      onSubmitted?.();
    } catch {
      await showErrorAlert(t, 'storeReviews.submitError');
    }
  };

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 md:p-5 mt-4">
      <div className="mb-3">
        {orderNumber && (
          <p className="text-xs text-gray-500 mb-1">
            {t('orders.orderNumber')}: {orderNumber}
          </p>
        )}
        <h4 className="font-bold text-diyar-dark">{eligibility.vendor_name}</h4>
        <p className="text-sm text-gray-600 mt-1">{t('storeReviews.leaveReview')}</p>
      </div>

      <StarRating value={rating} onChange={setRating} size={28} className="mb-4" />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={t('storeReviews.commentPlaceholder')}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y min-h-20 bg-white"
      />

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          disabled={submitReview.isPending}
          onClick={() => void handleSubmit()}
          className={`${vendorButtonClass} flex-1 min-w-35 bg-diyar-brown text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-[#A67B5B] transition disabled:opacity-60 cursor-pointer`}
        >
          {submitReview.isPending ? (
            <Loader2 size={18} className="animate-spin mx-auto" />
          ) : (
            t('storeReviews.submit')
          )}
        </button>
        <button
          type="button"
          disabled={submitReview.isPending}
          onClick={onSkipped}
          className={`${vendorButtonClass} py-2.5 px-4 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-white cursor-pointer`}
        >
          {t('storeReviews.skip')}
        </button>
      </div>
    </div>
  );
}
