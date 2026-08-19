import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Pencil, Trash2 } from 'lucide-react';
import { StarRating } from './StarRating.tsx';
import { AuthPromptModal } from './AuthPromptModal.tsx';
import { UserAvatar } from '../profile/UserAvatar.tsx';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import type { ProductReview } from '../../api/productEngagement.ts';
import {
  useProductEngagementMutations,
  useProductReviews,
} from '../../hooks/catalog/useProductEngagement.ts';
import { confirmDeleteReview, showErrorAlert, showSuccessToast } from '../../lib/confirmDialog.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import { VendorReplyBlock } from '../reviews/VendorReplyBlock.tsx';
import type { Locale } from '../../lib/i18n/types.ts';

const MAX_COMMENT_LENGTH = 2000;

interface ProductReviewsSectionProps {
  productId: string;
  isOwnStore?: boolean;
}

function formatReviewDate(iso: string | undefined, locale: Locale): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function validateReviewInput(rating: number, comment: string): string | null {
  if (rating < 1 || rating > 5) {
    return 'catalog.productDetail.reviewRatingRequired';
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return 'catalog.productDetail.reviewCommentTooLong';
  }

  return null;
}

function ReviewCard({
  item,
  canManage,
  onEdit,
  onDelete,
  isDeleting,
  t,
  locale,
  vendorStore,
}: {
  item: ProductReview;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  t: (key: string) => string;
  locale: Locale;
  vendorStore?: { name: string; logo_url?: string | null } | null;
}) {
  const displayDate = formatReviewDate(item.updated_at ?? item.created_at, locale);
  const wasEdited = item.updated_at && item.created_at && item.updated_at !== item.created_at;

  return (
    <article className="w-full rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow animate-in fade-in duration-300">
      <div className="flex items-start gap-4 mb-3">
        <UserAvatar name={item.author_name} avatarUrl={item.author_avatar_url} size="sm" />
        <div className="flex-1 min-w-0 text-right">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-bold text-diyar-dark text-sm block truncate">
                {item.author_name ?? t('catalog.productDetail.anonymousReviewer')}
              </span>
              {displayDate && (
                <time
                  dateTime={item.updated_at ?? item.created_at}
                  className="text-xs text-gray-400 tabular-nums"
                  dir="ltr"
                >
                  {displayDate}
                  {wasEdited ? ` · ${t('catalog.productDetail.reviewEdited')}` : ''}
                </time>
              )}
            </div>
            <StarRating value={item.rating} readOnly size={16} />
          </div>
        </div>
      </div>

      {item.comment && (
        <p className="text-sm text-gray-600 leading-relaxed text-right pr-0 md:pr-14">
          {item.comment}
        </p>
      )}

      {item.vendor_reply && (
        <div className="mt-4 pr-0 md:pr-14">
          <VendorReplyBlock
            reply={item.vendor_reply}
            repliedBy={item.vendor_replied_by ?? vendorStore?.name}
            repliedAt={item.vendor_replied_at}
            avatarUrl={vendorStore?.logo_url}
            locale={locale}
            t={t}
            compact
          />
        </div>
      )}

      {canManage && onEdit && onDelete && (
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
          <button
            type="button"
            onClick={onEdit}
            className={`${vendorButtonClass} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-diyar-brown bg-amber-50 hover:bg-amber-100 border border-amber-100 cursor-pointer`}
          >
            <Pencil size={14} />
            {t('catalog.productDetail.editReview')}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void onDelete()}
            className={`${vendorButtonClass} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 cursor-pointer disabled:opacity-50`}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {t('catalog.productDetail.deleteReview')}
          </button>
        </div>
      )}
    </article>
  );
}

function ReviewForm({
  title,
  rating,
  comment,
  isSaving,
  submitLabel,
  cancelLabel,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
  showCancel,
  t,
}: {
  title: string;
  rating: number;
  comment: string;
  isSaving: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-5 md:p-6 mb-8">
      <h3 className="font-bold text-diyar-dark mb-4">{title}</h3>
      <StarRating value={rating} onChange={onRatingChange} size={28} className="mb-4" />
      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        rows={4}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={t('catalog.productDetail.reviewPlaceholder')}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm text-right focus:outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 resize-y min-h-24 bg-white"
      />
      <p className="text-xs text-gray-400 mt-1 text-left tabular-nums" dir="ltr">
        {comment.length}/{MAX_COMMENT_LENGTH}
      </p>
      <div className={`flex gap-2 mt-4 ${showCancel ? '' : ''}`}>
        <button
          type="button"
          disabled={isSaving}
          onClick={onSubmit}
          className={`${vendorButtonClass} ${showCancel ? 'flex-1' : 'w-full'} bg-diyar-brown text-white py-3 rounded-xl hover:bg-[#A67B5B]/90 shadow-md cursor-pointer disabled:opacity-60`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : submitLabel}
        </button>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`${vendorButtonClass} px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-white cursor-pointer`}
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductReviewsSection({
  productId,
  isOwnStore = false,
}: ProductReviewsSectionProps) {
  const { t, dir, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useProductReviews(productId, page);
  const { review, updateReview, deleteReview } = useProductEngagementMutations(productId);

  const reviews = data?.items ?? [];
  const myReview = isAuthenticated ? (data?.my_review ?? null) : null;
  const vendorStore = data?.vendor_store ?? null;
  const pagination = data?.pagination;
  const totalPages = pagination?.last_page ?? 1;
  const hasOwnReview = Boolean(myReview);
  const showAddForm = isAuthenticated && !hasOwnReview && !isEditing && !isOwnStore;
  const showEditForm = isAuthenticated && hasOwnReview && isEditing;
  const showGuestPrompt =
    !isAuthenticated && !isLoading && reviews.length === 0 && !hasOwnReview && !isOwnStore;

  useEffect(() => {
    if (!isAuthenticated) {
      setIsEditing(false);
      setRating(5);
      setComment('');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isEditing && myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? '');
    }
  }, [isEditing, myReview]);

  const resetForm = () => {
    setRating(5);
    setComment('');
    setIsEditing(false);
  };

  const handleStartAdd = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    resetForm();
  };

  const handleStartEdit = () => {
    if (!isAuthenticated || !myReview) {
      return;
    }
    setRating(myReview.rating);
    setComment(myReview.comment ?? '');
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    const trimmed = comment.trim();
    const validationError = validateReviewInput(rating, trimmed);
    if (validationError) {
      await showErrorAlert(t, validationError);
      return;
    }

    try {
      if (isEditing && hasOwnReview) {
        await updateReview.mutateAsync({ rating, comment: trimmed || undefined });
        await showSuccessToast(t, 'catalog.productDetail.reviewUpdated');
      } else {
        await review.mutateAsync({ rating, comment: trimmed || undefined });
        await showSuccessToast(t, 'catalog.productDetail.reviewSaved');
      }
      resetForm();
      setPage(1);
    } catch {
      await showErrorAlert(t, 'catalog.productDetail.reviewError');
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) {
      return;
    }

    const confirmed = await confirmDeleteReview(t);
    if (!confirmed) {
      return;
    }

    try {
      await deleteReview.mutateAsync();
      resetForm();
      await showSuccessToast(t, 'catalog.productDetail.reviewDeleted');
      setPage(1);
    } catch {
      await showErrorAlert(t, 'catalog.productDetail.reviewError');
    }
  };

  const isSaving = review.isPending || updateReview.isPending;

  return (
    <section className="bg-white border-t border-gray-100 py-10 md:py-14" dir={dir}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="text-diyar-brown" size={24} />
          <h2 className="text-xl md:text-2xl font-bold text-diyar-dark">
            {t('catalog.productDetail.reviewsTitle')}
          </h2>
        </div>

        {showGuestPrompt && (
          <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center mb-8">
            <p className="text-sm text-gray-500 mb-4">
              {t('catalog.productDetail.signInToReview')}
            </p>
            <button
              type="button"
              onClick={handleStartAdd}
              className={`${vendorButtonClass} max-w-xs mx-auto w-full bg-diyar-brown text-white py-3 rounded-xl hover:bg-[#A67B5B]/90 shadow-md cursor-pointer`}
            >
              {t('catalog.productDetail.authLogin')}
            </button>
          </div>
        )}

        {showAddForm && (
          <ReviewForm
            title={t('catalog.productDetail.addReview')}
            rating={rating}
            comment={comment}
            isSaving={isSaving}
            submitLabel={t('catalog.productDetail.submitReview')}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmit={() => void handleSubmit()}
            t={t}
          />
        )}

        {showEditForm && (
          <ReviewForm
            title={t('catalog.productDetail.editReview')}
            rating={rating}
            comment={comment}
            isSaving={isSaving}
            submitLabel={t('catalog.productDetail.updateReview')}
            cancelLabel={t('catalog.productDetail.reviewCancel')}
            showCancel
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmit={() => void handleSubmit()}
            onCancel={resetForm}
            t={t}
          />
        )}

        <div className="w-full space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-diyar-brown" size={28} />
            </div>
          ) : reviews.length === 0 ? (
            !showGuestPrompt && (
              <p className="text-gray-500 text-sm text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                {t('catalog.productDetail.noReviews')}
              </p>
            )
          ) : (
            reviews.map((item) => {
              const isOwnReview = isAuthenticated && Boolean(item.is_owner);
              return (
                <ReviewCard
                  key={item.id}
                  item={item}
                  canManage={isOwnReview}
                  onEdit={isOwnReview ? handleStartEdit : undefined}
                  onDelete={isOwnReview ? handleDelete : undefined}
                  isDeleting={deleteReview.isPending}
                  t={t}
                  locale={locale}
                  vendorStore={vendorStore}
                />
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`${vendorButtonClass} px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 cursor-pointer`}
              >
                {t('catalog.productDetail.prevPage')}
              </button>
              <span className="text-sm text-gray-500 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`${vendorButtonClass} px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 cursor-pointer`}
              >
                {t('catalog.productDetail.nextPage')}
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthPromptModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}
