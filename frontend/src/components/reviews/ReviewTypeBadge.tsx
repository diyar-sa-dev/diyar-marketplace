import type { CustomerReviewType } from '../../api/customerReviews.ts';

export type ServiceReviewSource = 'rfq' | 'direct';

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

const SERVICE_SOURCE_LABEL_KEYS: Record<ServiceReviewSource, string> = {
  rfq: 'customerReviews.typeServiceRequest',
  direct: 'customerReviews.typeServiceDirect',
};

const SERVICE_SOURCE_STYLES: Record<ServiceReviewSource, string> = {
  rfq: 'bg-sky-50 text-sky-800 border-sky-100',
  direct: 'bg-violet-50 text-violet-700 border-violet-100',
};

interface ReviewTypeBadgeProps {
  type: CustomerReviewType;
  serviceSource?: ServiceReviewSource | null;
  t: (key: string) => string;
}

export function ReviewTypeBadge({ type, serviceSource = null, t }: ReviewTypeBadgeProps) {
  const isServiceSource = type === 'service' && (serviceSource === 'rfq' || serviceSource === 'direct');
  const labelKey = isServiceSource ? SERVICE_SOURCE_LABEL_KEYS[serviceSource] : TYPE_LABEL_KEYS[type];
  const style = isServiceSource ? SERVICE_SOURCE_STYLES[serviceSource] : TYPE_STYLES[type];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${style}`}
    >
      {t(labelKey)}
    </span>
  );
}
