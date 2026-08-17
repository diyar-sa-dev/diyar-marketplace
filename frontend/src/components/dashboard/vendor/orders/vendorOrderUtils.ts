import type { VendorOrder } from '../../../../types/order.ts';
import type { Locale } from '../../../../lib/i18n/types.ts';

export type VendorOrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export type VendorOrderAction = 'accept' | 'process' | 'ship' | 'deliver' | 'cancel';

export type PaymentFilter = 'all' | 'paid' | 'pending' | 'failed' | 'refunded';

export type VendorShippingAddressLines = {
  heading: string | null;
  city: string | null;
  districtStreet: string | null;
  buildingApartment: string | null;
};

const PLACEHOLDER_VALUES = new Set(['—', '-', 'n/a', 'na']);

function isMeaningful(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }

  return !PLACEHOLDER_VALUES.has(trimmed.toLowerCase());
}

export function formatPhoneInternational(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }

  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('966')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+966${digits.slice(1)}`;
  }

  return `+${digits}`;
}

export function vendorOrderDisplayNumber(order: VendorOrder): string {
  return order.order_number ?? `#${order.order_id.slice(0, 8)}`;
}

export function vendorOrderItemCount(order: VendorOrder): number {
  return order.items?.length ?? 0;
}

export function matchesVendorOrderTab(order: VendorOrder, tab: VendorOrderTab): boolean {
  if (tab === 'all') {
    return true;
  }

  if (tab === 'processing') {
    return order.status === 'processing' || order.status === 'accepted';
  }

  return order.status === tab;
}

export function matchesPaymentFilter(order: VendorOrder, filter: PaymentFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  const status = order.payment_status ?? 'pending';

  if (filter === 'paid') {
    return status === 'paid';
  }

  if (filter === 'pending') {
    return status === 'pending' || status === 'processing';
  }

  if (filter === 'failed') {
    return status === 'failed' || status === 'expired' || status === 'cancelled';
  }

  if (filter === 'refunded') {
    return status === 'refunded';
  }

  return true;
}

export function resolveAddressHeading(
  address: NonNullable<VendorOrder['shipping_address']>,
  locale: Locale,
): string | null {
  if (isMeaningful(address.label)) {
    return address.label;
  }

  if (address.type === 'home') {
    return locale === 'ar' ? 'المنزل' : 'Home';
  }

  if (address.type === 'work') {
    return locale === 'ar' ? 'العمل' : 'Work';
  }

  return null;
}

export function buildVendorShippingAddressLines(
  order: VendorOrder,
  locale: Locale,
): VendorShippingAddressLines {
  const address = order.shipping_address;
  if (!address) {
    return {
      heading: null,
      city: null,
      districtStreet: null,
      buildingApartment: null,
    };
  }

  const districtStreetParts = [address.district, address.street].filter(isMeaningful);
  const buildingApartmentParts = [address.building, address.apartment].filter(isMeaningful);

  return {
    heading: resolveAddressHeading(address, locale),
    city: isMeaningful(address.city) ? address.city : null,
    districtStreet: districtStreetParts.length > 0 ? districtStreetParts.join('، ') : null,
    buildingApartment: buildingApartmentParts.length > 0 ? buildingApartmentParts.join('، ') : null,
  };
}

export function formatVendorShippingAddress(order: VendorOrder, locale: Locale): string {
  const lines = buildVendorShippingAddressLines(order, locale);

  return [lines.heading, lines.city, lines.districtStreet, lines.buildingApartment]
    .filter(Boolean)
    .join('\n');
}
