import type { ProviderBooking } from '../types/providerDashboard.ts';

export function canProviderCancelBooking(
  booking: Pick<ProviderBooking, 'status' | 'payment_status'>,
): boolean {
  if (booking.payment_status === 'paid') {
    return false;
  }

  return (
    booking.status === 'pending_provider_confirmation' ||
    booking.status === 'pending_customer_acceptance' ||
    booking.status === 'pending_payment'
  );
}
