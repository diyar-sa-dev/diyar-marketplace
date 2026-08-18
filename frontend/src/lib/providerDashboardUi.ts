import type { Locale } from './i18n/types.ts';
import type { ProviderBooking } from '../types/providerDashboard.ts';
import type { ServiceRequestCard } from '../types/serviceRequests.ts';
import { formatRelativeOfferDay } from './formatRelativeDay.ts';

export function formatProviderBudget(
  budgetMin?: string | null,
  budgetMax?: string | null,
  locale: Locale = 'ar',
): string {
  const min = budgetMin ? Number(budgetMin) : null;
  const max = budgetMax ? Number(budgetMax) : null;

  if (min != null && max != null && min !== max) {
    return `${min} - ${max} ر.س`;
  }

  if (min != null && max == null) {
    return locale === 'ar' ? `${min}+ ر.س` : `${min}+ SAR`;
  }

  if (max != null) {
    return `${max} ر.س`;
  }

  return locale === 'ar' ? 'غير محدد' : 'Not specified';
}

export function formatProviderRequestDate(value: string | undefined, locale: Locale): string {
  return formatRelativeOfferDay(value, locale);
}

export function providerCategoryLabel(
  item: Pick<ServiceRequestCard, 'categories'>,
  locale: Locale,
): string {
  const category = item.categories?.[0];
  if (!category) {
    return locale === 'ar' ? 'خدمة عامة' : 'General service';
  }
  return locale === 'ar' ? category.name_ar : category.name_en;
}

export function mapProviderBookingUiStatus(
  booking: Pick<ProviderBooking, 'status'>,
): 'pending' | 'upcoming' | 'completed' | 'cancelled' {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }
  if (booking.status === 'completed') {
    return 'completed';
  }
  if (booking.status === 'pending_payment') {
    return 'pending';
  }
  return 'upcoming';
}

export function formatBookingDisplayDate(booking: ProviderBooking): string {
  if (booking.scheduled_date) {
    return booking.scheduled_date;
  }
  if (booking.created_at) {
    return booking.created_at.slice(0, 10);
  }
  return '—';
}

export function formatBookingDisplayTime(booking: ProviderBooking): string {
  if (booking.scheduled_time) {
    return booking.scheduled_time;
  }
  return '—';
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
