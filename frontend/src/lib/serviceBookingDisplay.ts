import type { ServiceBooking, ServiceBookingStatus } from '../types/serviceRequests.ts';

function cleanBookingTitle(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  const withoutCategoryPrefix = trimmed
    .replace(/^(?:\[|\().*?(?:تصنيف|category).*?(?:\]|\))\s*/iu, '')
    .trim();

  if (withoutCategoryPrefix.length >= 3) {
    return withoutCategoryPrefix;
  }

  return trimmed.length >= 3 ? trimmed : null;
}

export function resolveBookingTitle(
  booking: Pick<ServiceBooking, 'service_title' | 'service' | 'service_request'>,
  fallback: string,
): string {
  const candidates = [
    booking.service?.title,
    booking.service_title,
    booking.service_request?.title,
  ];

  for (const candidate of candidates) {
    const cleaned = cleanBookingTitle(candidate);
    if (cleaned) {
      return cleaned;
    }
  }

  return fallback;
}

export function formatBookingTime(time?: string | null): string {
  if (!time) {
    return '';
  }

  return time.slice(0, 5);
}

export function resolveServiceTypeLabel(service: {
  service_type_label?: string | null;
  delivery_type_label?: string | null;
}): string | null {
  const label = service.service_type_label?.trim() || service.delivery_type_label?.trim();
  return label || null;
}

export function bookingStatusBadgeClass(status: ServiceBookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending_provider_confirmation':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'pending_customer_acceptance':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'pending_payment':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
