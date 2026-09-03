import { resolveMediaUrl } from './media.ts';
import type {
  PendingCustomerReview,
  PublishedCustomerReview,
} from '../api/customerReviews.ts';

type ReviewCardItem = PublishedCustomerReview | PendingCustomerReview;

export function customerReviewSubjectTitle(item: ReviewCardItem, fallback: string): string {
  if (item.type === 'product') {
    return item.product?.name?.trim() || fallback;
  }

  if (item.type === 'service') {
    return item.service?.title?.trim() || item.provider?.name?.trim() || fallback;
  }

  if (item.type === 'b2b') {
    return item.company?.name?.trim() || fallback;
  }

  return item.store?.name?.trim() || fallback;
}

export function customerReviewServiceSource(
  item: ReviewCardItem,
): 'rfq' | 'direct' | null {
  if (item.type !== 'service') {
    return null;
  }

  if (item.booking_source === 'rfq' || item.booking_source === 'direct') {
    return item.booking_source;
  }

  return item.request_reference ? 'rfq' : null;
}

export function customerReviewSubjectImage(item: ReviewCardItem): string | undefined {
  if (item.type === 'product') {
    return resolveMediaUrl(item.product?.image_url);
  }

  if (item.type === 'service') {
    return resolveMediaUrl(item.service?.image_url) ?? resolveMediaUrl(item.provider?.logo_url);
  }

  if (item.type === 'b2b') {
    return resolveMediaUrl(item.company?.logo_url);
  }

  return resolveMediaUrl(item.store?.logo_url);
}
