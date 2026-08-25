import type { CustomerReviewType } from '../../api/customerReviews.ts';

const TYPE_LABEL_KEYS: Record<CustomerReviewType, string> = {
  product: 'customerReviews.typeProduct',
  store: 'customerReviews.typeStore',
  service: 'customerReviews.typeService',
  b2b: 'customerReviews.typeB2b',
};

const TYPE_STYLES: Record<CustomerReviewType, string> = {
  product: 'bg-blue-50 text-blue-700 border-blue-100',
  store: 'bg-amber-50 text-amber-800 border-amber-100',
  service: 'bg-violet-50 text-violet-700 border-violet-100',
  b2b: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

interface ReviewTypeBadgeProps {
  type: CustomerReviewType;
  t: (key: string) => string;
}

export function ReviewTypeBadge({ type, t }: ReviewTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${TYPE_STYLES[type]}`}
    >
      {t(TYPE_LABEL_KEYS[type])}
    </span>
  );
}
