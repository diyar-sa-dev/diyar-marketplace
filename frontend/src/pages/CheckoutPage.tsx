import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  Receipt,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { cartSync } from '../hooks/cart/cartSync.ts';
import { useCartQuery } from '../hooks/cart/useCart.ts';
import { useAddresses } from '../hooks/profile/useProfile.ts';
import { useCheckoutPreview, useCreateOrder } from '../hooks/checkout/useCheckout.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { CartLineItemCard, cartItemToLineProps } from '../components/checkout/CartLineItemCard.tsx';
import { CheckoutVendorCoupon } from '../components/checkout/CheckoutVendorCoupon.tsx';
import { CheckoutPaymentMethods } from '../components/checkout/CheckoutPaymentMethods.tsx';
import { parseApiError } from '../utils/errors.ts';
import {
  readStoredPaymentMethod,
  storePaymentMethod,
  type CheckoutPaymentMethodId,
} from '../lib/paymentMethods.ts';
import type { Locale } from '../lib/i18n/types.ts';
import type {
  CheckoutPreviewPayload,
  CheckoutPreviewVendorGroup,
  VendorDeliverySelection,
} from '../types/checkout.ts';
import type { CartItem } from '../types/cart.ts';
import type { ShippingMethod } from '../types/shipping.ts';

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

type CartVendorGroup = {
  vendorAccountId: string;
  vendorName: string;
  items: CartItem[];
};

function groupCartItemsByVendor(items: CartItem[]): CartVendorGroup[] {
  const groups = new Map<string, CartVendorGroup>();

  for (const item of items) {
    const vendorAccountId = item.product?.vendor?.vendor_account_id;
    if (!vendorAccountId) {
      continue;
    }

    const existing = groups.get(vendorAccountId);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(vendorAccountId, {
      vendorAccountId,
      vendorName: item.product?.vendor?.store_name ?? '—',
      items: [item],
    });
  }

  return Array.from(groups.values());
}

function isVendorShippingError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('vendor shipping') ||
    normalized.includes('إعدادات شحن') ||
    normalized.includes('شحن البائع')
  );
}

function findCartItem(
  cartItems: CartItem[],
  itemId: string,
  productId: string,
): CartItem | undefined {
  return (
    cartItems.find((entry) => entry.id === itemId) ??
    cartItems.find((entry) => entry.product_id === productId)
  );
}

function formatAddressLine(
  address: {
    district: string | null;
    street: string | null;
    city: string | null;
    building: string | null;
  },
  locale: Locale,
): string {
  const separator = locale === 'ar' ? '، ' : ', ';
  return [address.district, address.street, address.city, address.building]
    .filter(Boolean)
    .join(separator);
}

export default function CheckoutPage() {
  const { t, dir, locale } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currency = t('common.currency');
  const isRtl = dir === 'rtl';
  const ContinueIcon = isRtl ? ChevronRight : ChevronLeft;
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const { data: cart, isLoading: cartLoading } = useCartQuery();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [methodByVendor, setMethodByVendor] = useState<Record<string, ShippingMethod>>({});
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [cartFlushed, setCartFlushed] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CheckoutPaymentMethodId>(
    () => readStoredPaymentMethod() ?? 'mada',
  );

  const lineLabels = useMemo(
    () => ({
      productFallback: t('cart.sidebar.productFallback'),
      colorLabel: t('cart.sidebar.colorLabel'),
      sizeLabel: t('cart.sidebar.sizeLabel'),
      quantityLabel: t('cart.sidebar.quantityLabel'),
      currency,
    }),
    [currency, t],
  );

  useEffect(() => {
    void (async () => {
      try {
        await cartSync.flush();
      } catch {
        toast.error(t('checkout.syncFailed'));
      } finally {
        setCartFlushed(true);
      }
    })();
  }, [t, toast]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const cartItems = cart?.items ?? [];
  const cartVendorGroups = useMemo(() => groupCartItemsByVendor(cartItems), [cartItems]);

  const previewPayload = useMemo<CheckoutPreviewPayload | null>(() => {
    if (!selectedAddressId || Object.keys(methodByVendor).length === 0) {
      return null;
    }

    const vendor_delivery_selections: VendorDeliverySelection[] = Object.entries(
      methodByVendor,
    ).map(([vendor_account_id, method]) => ({ vendor_account_id, method }));

    return { shipping_address_id: selectedAddressId, vendor_delivery_selections };
  }, [methodByVendor, selectedAddressId]);

  const hasAddress = addresses.length > 0 && selectedAddressId !== '';
  const previewQuery = useCheckoutPreview(
    previewPayload,
    previewEnabled && cartFlushed && hasAddress,
  );

  useEffect(() => {
    setPreviewEnabled(hasAddress);
  }, [hasAddress, methodByVendor]);

  const createOrder = useCreateOrder();

  useEffect(() => {
    if (!cartFlushed || cartLoading) {
      return;
    }

    if ((cart?.items ?? []).length === 0) {
      navigate('/', { replace: true });
    }
  }, [cart?.items, cartFlushed, cartLoading, navigate]);

  useEffect(() => {
    if (!cartItems.length) {
      return;
    }

    setMethodByVendor((prev) => {
      const next = { ...prev };
      for (const item of cartItems) {
        const vendorId = item.product?.vendor?.vendor_account_id;
        if (vendorId && !next[vendorId]) {
          next[vendorId] = 'carrier';
        }
      }
      return next;
    });
  }, [cartItems]);

  const handleMethodChange = (vendorId: string, method: ShippingMethod) => {
    setMethodByVendor((prev) => ({ ...prev, [vendorId]: method }));
  };

  const handlePlaceOrder = async () => {
    if (!previewPayload || !previewQuery.data?.valid) {
      return;
    }

    try {
      storePaymentMethod(selectedPaymentMethod);
      const order = await createOrder.mutateAsync({
        payload: previewPayload,
        idempotencyKey: newIdempotencyKey(),
      });
      toast.success(t('checkout.orderPlaced'));
      navigate(`/checkout/payment/${order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('checkout.orderFailed'));
    }
  };

  if (!cartFlushed || addressesLoading || cartLoading) {
    return <LoadingState message={t('checkout.loading')} />;
  }

  if (cartItems.length === 0) {
    return <LoadingState message={t('checkout.loading')} />;
  }

  const preview = previewQuery.data;
  const previewErrorMessage = previewQuery.isError
    ? parseApiError(previewQuery.error).message
    : null;
  const vendorShippingBlocked = previewErrorMessage
    ? isVendorShippingError(previewErrorMessage)
    : false;
  const canPlaceOrder = hasAddress && Boolean(preview?.valid) && !createOrder.isPending;

  const displayGroups: Array<
    | { type: 'preview'; group: CheckoutPreviewVendorGroup }
    | { type: 'cart'; group: CartVendorGroup }
  > = preview?.valid
    ? preview.vendor_groups.map((group) => ({ type: 'preview' as const, group }))
    : cartVendorGroups.map((group) => ({ type: 'cart' as const, group }));

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-8">
          {t('checkout.pageTitle')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="font-bold text-lg text-diyar-dark">
                  {t('checkout.deliveryAddress')}
                </h2>
                <Link
                  to="/profile/addresses"
                  className="inline-flex items-center gap-1 text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer"
                >
                  <Plus size={16} />
                  {t('checkout.addNewAddress')}
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-6 text-center space-y-4">
                  <p className="text-sm text-gray-600">{t('checkout.noAddressHint')}</p>
                  <Link
                    to="/profile/addresses"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-diyar-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-diyar-dark transition"
                  >
                    <Plus size={16} />
                    {t('checkout.addNewAddress')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;

                    return (
                      <label
                        key={address.id}
                        className={`relative block border rounded-xl p-4 cursor-pointer transition h-full ${
                          isSelected
                            ? 'border-diyar-brown bg-amber-50/40 ring-1 ring-diyar-brown/20 pt-5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div
                            className="absolute -top-3 inset-e-4 flex h-7 w-7 items-center justify-center rounded-full bg-diyar-brown text-white shadow-md ring-2 ring-white"
                            aria-hidden="true"
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                        <input
                          type="radio"
                          name="address"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <div className="font-bold text-diyar-dark mb-1">{address.label}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {formatAddressLine(address, locale)}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {!hasAddress && cartVendorGroups.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {t('checkout.addressRequired')}
              </div>
            )}

            {hasAddress && previewQuery.isLoading && (
              <LoadingState message={t('checkout.previewLoading')} />
            )}

            {hasAddress && previewQuery.isError && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
                  vendorShippingBlocked
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {vendorShippingBlocked
                      ? t('checkout.previewUnavailable')
                      : t('checkout.previewError')}
                  </p>
                  <p className="mt-1">{previewErrorMessage}</p>
                </div>
              </div>
            )}

            {preview && !preview.valid && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-bold">{t('checkout.invalidCart')}</p>
                <p className="mt-1">{t('checkout.fixCartIssues')}</p>
              </div>
            )}

            <section className="space-y-4">
              <h2 className="font-bold text-lg text-diyar-dark px-1">
                {t('checkout.productsAndShipping')}
              </h2>

              {displayGroups.map((entry) => {
                const vendorId =
                  entry.type === 'preview'
                    ? entry.group.vendor_account_id
                    : entry.group.vendorAccountId;
                const vendorName =
                  entry.type === 'preview' ? entry.group.vendor_name : entry.group.vendorName;
                const previewGroup = entry.type === 'preview' ? entry.group : null;
                const sectionDisabled = !hasAddress || !preview?.valid;

                return (
                  <div
                    key={vendorId}
                    className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5 ${
                      sectionDisabled ? 'opacity-80' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <h3 className="font-bold text-diyar-dark text-base">{vendorName}</h3>
                      {previewGroup ? (
                        <div className="text-sm font-bold text-diyar-brown flex items-center gap-2">
                          <Truck size={16} />
                          {t('checkout.shippingCostLabel')}: {previewGroup.shipping.cost} {currency}
                          {previewGroup.shipping.free_shipping_applied && (
                            <span className="text-green-600 font-medium">
                              ({t('checkout.freeShipping')})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {t('checkout.summaryPending')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-5">
                      {entry.type === 'preview'
                        ? entry.group.items.map((item) => {
                            const cartItem = findCartItem(cartItems, item.item_id, item.product_id);
                            const props = cartItem
                              ? cartItemToLineProps(cartItem, lineLabels)
                              : {
                                  name: item.product_name,
                                  imageUrl: null,
                                  vendorName,
                                  color: item.color?.name
                                    ? {
                                        name: item.color.name,
                                        hex_code: item.color.hex_code ?? '#ccc',
                                      }
                                    : null,
                                  product: null,
                                  unitPrice: item.unit_price,
                                  quantity: item.quantity,
                                  currency,
                                  productFallbackLabel: lineLabels.productFallback,
                                  colorLabel: lineLabels.colorLabel,
                                  sizeLabel: lineLabels.sizeLabel,
                                  quantityLabel: lineLabels.quantityLabel,
                                };

                            return (
                              <div
                                key={item.item_id}
                                className="pb-5 border-b border-gray-100 last:border-0 last:pb-0"
                              >
                                <CartLineItemCard {...props} />
                              </div>
                            );
                          })
                        : entry.group.items.map((item) => (
                            <div
                              key={item.id}
                              className="pb-5 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                              <CartLineItemCard {...cartItemToLineProps(item, lineLabels)} />
                            </div>
                          ))}
                    </div>

                    {previewGroup ? (
                      <>
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm font-bold text-gray-700 mb-3">
                            {t('checkout.deliveryMethod')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {previewGroup.available_methods.map((method) => (
                              <button
                                key={method}
                                type="button"
                                disabled={sectionDisabled}
                                onClick={() => handleMethodChange(vendorId, method)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                                  methodByVendor[vendorId] === method
                                    ? 'border-diyar-brown bg-amber-50 text-diyar-brown'
                                    : 'border-gray-200 text-gray-700 hover:border-diyar-brown/40 hover:bg-amber-50/30'
                                }`}
                              >
                                {t(`shipping.methods.${method}`)}
                              </button>
                            ))}
                          </div>
                          {methodByVendor[vendorId] === 'pickup' &&
                            previewGroup.shipping.pickup_location_label && (
                              <p className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                {t('checkout.pickupAt')}:{' '}
                                {previewGroup.shipping.pickup_location_label}
                              </p>
                            )}
                        </div>
                        <CheckoutVendorCoupon vendorName={vendorName} />
                      </>
                    ) : (
                      <>
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          {!hasAddress
                            ? t('checkout.summaryPending')
                            : vendorShippingBlocked
                              ? t('checkout.vendorShippingNotConfigured')
                              : t('checkout.summaryPending')}
                        </div>
                        <CheckoutVendorCoupon vendorName={vendorName} />
                      </>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-lg text-diyar-dark mb-4 flex items-center gap-2">
                <CreditCard className="text-diyar-brown" size={20} />
                {t('checkout.paymentSection')}
              </h2>
              <CheckoutPaymentMethods
                selected={selectedPaymentMethod}
                onChange={setSelectedPaymentMethod}
              />
              <p className="text-sm text-gray-500 leading-relaxed mt-4">
                {t('checkout.paymentSecureHint')}
              </p>
            </section>
          </div>

          <aside className="h-fit sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/60">
            <div className="bg-linear-to-l from-diyar-dark via-[#2a2520] to-diyar-brown px-6 py-5">
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Receipt size={18} strokeWidth={2.5} />
                </span>
                {t('checkout.orderSummary')}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {preview?.valid ? (
                <div className="space-y-1 rounded-2xl border border-gray-100 bg-linear-to-b from-gray-50/90 to-white p-4">
                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100/80 last:border-0">
                    <span className="text-sm font-semibold text-gray-500">
                      {t('checkout.subtotal')}
                    </span>
                    <span className="text-base font-bold text-diyar-dark tabular-nums whitespace-nowrap">
                      {preview.totals.subtotal}{' '}
                      <span className="text-sm font-bold text-diyar-brown">{currency}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100/80 last:border-0">
                    <span className="text-sm font-semibold text-gray-500">
                      {t('checkout.shipping')}
                    </span>
                    <span className="text-base font-bold text-diyar-dark tabular-nums whitespace-nowrap">
                      {preview.totals.shipping}{' '}
                      <span className="text-sm font-bold text-diyar-brown">{currency}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-sm font-semibold text-gray-500">{t('checkout.vat')}</span>
                    <span className="text-base font-bold text-diyar-dark tabular-nums whitespace-nowrap">
                      {preview.totals.vat}{' '}
                      <span className="text-sm font-bold text-diyar-brown">{currency}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                    {!hasAddress ? t('checkout.noAddressHint') : t('checkout.summaryPending')}
                  </p>
                </div>
              )}

              {preview?.valid && (
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-diyar-dark px-5 py-4 text-white shadow-inner">
                  <span className="text-base font-bold">{t('checkout.total')}</span>
                  <div className="text-end">
                    <span className="block text-2xl font-extrabold tabular-nums leading-none tracking-tight">
                      {preview.totals.total}
                    </span>
                    <span className="mt-1 block text-xs font-bold text-white/75">{currency}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!canPlaceOrder}
                onClick={() => void handlePlaceOrder()}
                className="w-full rounded-2xl bg-diyar-brown py-4 text-base font-extrabold text-white shadow-lg shadow-diyar-brown/25 transition hover:bg-[#A67B5B] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2.5"
              >
                <ShieldCheck size={20} strokeWidth={2.5} />
                {createOrder.isPending ? t('checkout.placingOrder') : t('checkout.placeOrder')}
              </button>

              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-3 py-2.5">
                <ShieldCheck size={15} className="shrink-0 text-emerald-600" strokeWidth={2.5} />
                <p className="text-xs font-bold text-emerald-800 text-center leading-snug">
                  {t('checkout.securePaymentNote')}
                </p>
              </div>

              <Link
                to="/"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-diyar-brown"
              >
                <ContinueIcon size={16} aria-hidden="true" />
                {t('checkout.continueShopping')}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
