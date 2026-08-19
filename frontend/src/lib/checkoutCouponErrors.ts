/** Backend coupon validation messages (EN + AR) returned on checkout preview. */
const COUPON_ERROR_MARKERS = [
  'coupon',
  'كوبون',
  'Invalid coupon',
  'رمز الكوبون',
  'does not apply to this store',
  'لا ينطبق على هذا المتجر',
  'not active',
  'غير نشط',
  'expired',
  'انتهت صلاحية',
  'usage limit',
  'حد الاستخدام',
  'minimum',
  'الحد الأدنى',
  'not available yet',
  'غير متاح بعد',
];

export function isCheckoutCouponError(message: string): boolean {
  const lower = message.toLowerCase();

  return COUPON_ERROR_MARKERS.some(
    (marker) => lower.includes(marker.toLowerCase()) || message.includes(marker),
  );
}
