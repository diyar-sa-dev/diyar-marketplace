import { useState } from 'react';
import { RotateCcw, Star } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

function isStarHighlighted(star: number, activeRating: number): boolean {
  return activeRating > 0 && star <= activeRating;
}

type AdminFeedbackRatingFilterProps = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

export function AdminFeedbackRatingFilter({
  value,
  onChange,
  compact = false,
}: AdminFeedbackRatingFilterProps) {
  const { t, locale, dir } = useLocale();
  const isRtl = dir === 'rtl' || locale === 'ar';
  const [hoverRating, setHoverRating] = useState(0);
  const selectedRating = value ? Number(value) : 0;
  const previewRating = hoverRating || selectedRating;
  const starSize = compact ? 16 : 18;

  // RTL: 1→5 left-to-right, highlight grows left → right.
  // LTR: 5→1 left-to-right visually, highlight grows right → left (toward 5).
  const displayStars = isRtl ? [...STAR_VALUES] : [...STAR_VALUES].reverse();

  return (
    <div className="inline-flex min-w-0 w-full flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 sm:w-auto sm:gap-2.5">
      <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
        {t('admin.feedback.ratingFilterLabel')}
      </span>
      <div
        dir="ltr"
        className="inline-flex items-center gap-0.5"
        role="group"
        aria-label={t('admin.feedback.ratingFilterLabel')}
        onMouseLeave={() => setHoverRating(0)}
      >
        {displayStars.map((rating) => {
          const filled = isStarHighlighted(rating, previewRating);
          const isSelected = value === String(rating);

          return (
            <button
              key={rating}
              type="button"
              onMouseEnter={() => setHoverRating(rating)}
              onClick={() => onChange(isSelected ? '' : String(rating))}
              aria-label={t('admin.feedback.ratingStars', { count: rating })}
              aria-pressed={isSelected}
              className={`cursor-pointer rounded-md p-0.5 transition-all hover:scale-110 ${
                isSelected ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-gray-50'
              }`}
            >
              <Star
                size={starSize}
                className={
                  filled
                    ? 'text-amber-400 fill-amber-400 transition-colors'
                    : 'text-gray-300 transition-colors'
                }
              />
            </button>
          );
        })}
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-gray-500 transition hover:bg-gray-50 hover:text-diyar-dark"
          title={t('admin.feedback.resetRatingFilter')}
        >
          <RotateCcw size={12} />
          <span className="hidden sm:inline">{t('admin.feedback.resetRatingFilter')}</span>
        </button>
      ) : null}
    </div>
  );
}

function StarRow({
  count,
  max = 5,
  size = 14,
  emptyClass = 'text-gray-300',
  filledClass = 'text-amber-400',
}: {
  count: number;
  max?: number;
  size?: number;
  emptyClass?: string;
  filledClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => {
        const value = index + 1;
        const filled = value <= count;
        return (
          <Star
            key={value}
            size={size}
            className={filled ? `${filledClass} fill-current` : emptyClass}
          />
        );
      })}
    </span>
  );
}

export function FeedbackRatingStars({
  rating,
  size = 14,
  showValue = false,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <StarRow count={rating} size={size} />
      {showValue ? (
        <span className="text-xs font-bold text-gray-500">{rating}/5</span>
      ) : null}
    </span>
  );
}
