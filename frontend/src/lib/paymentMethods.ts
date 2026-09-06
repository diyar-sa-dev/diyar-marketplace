export type CheckoutPaymentMethodId = 'mada' | 'card' | 'apple_pay' | 'tabby';

export type CheckoutPaymentMethod = {
  id: CheckoutPaymentMethodId;
  labelKey: `checkout.paymentMethods.${'mada' | 'card' | 'applePay' | 'tabby'}`;
  logo?: string;
  type: 'image' | 'icon';
  /** Canonical + gateway codes that map to this checkout option. */
  apiCodes: string[];
  /** When true, hide the option if the device/browser cannot use it. */
  requiresApplePay?: boolean;
};

export const CHECKOUT_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  {
    id: 'mada',
    labelKey: 'checkout.paymentMethods.mada',
    logo: '/payment-methods/Mada_Logo.svg',
    type: 'image',
    apiCodes: ['mada', 'md'],
  },
  {
    id: 'card',
    labelKey: 'checkout.paymentMethods.card',
    type: 'icon',
    apiCodes: ['card', 'visa_master', 'vm', 'visa', 'master', 'creditcard'],
  },
  {
    id: 'apple_pay',
    labelKey: 'checkout.paymentMethods.applePay',
    logo: '/payment-methods/Apple_Pay_logo.svg',
    type: 'image',
    apiCodes: ['apple_pay', 'ap'],
    requiresApplePay: true,
  },
  {
    id: 'tabby',
    labelKey: 'checkout.paymentMethods.tabby',
    logo: '/payment-methods/tabby-bnpl.svg',
    type: 'image',
    apiCodes: ['tabby'],
  },
];

export const CHECKOUT_PAYMENT_METHOD_STORAGE_KEY = 'diyar:checkout:paymentMethod';

const LEGACY_METHOD_IDS: Record<string, CheckoutPaymentMethodId> = {
  visa: 'card',
  apple: 'apple_pay',
};

export function readStoredPaymentMethod(): CheckoutPaymentMethodId | null {
  const value = sessionStorage.getItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
  if (!value) {
    return null;
  }

  if (value === 'mada' || value === 'card' || value === 'apple_pay' || value === 'tabby') {
    return value;
  }

  return LEGACY_METHOD_IDS[value] ?? null;
}

export function storePaymentMethod(id: CheckoutPaymentMethodId): void {
  sessionStorage.setItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY, id);
}

export function resolvePaymentMethodIdFromApiCode(code: string): CheckoutPaymentMethodId | null {
  const normalized = code.toLowerCase();
  return (
    CHECKOUT_PAYMENT_METHODS.find((method) => method.apiCodes.includes(normalized))?.id ?? null
  );
}

export function isApplePayDeviceAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return Boolean(window.ApplePaySession?.canMakePayments?.());
  } catch {
    return false;
  }
}

export function filterCheckoutMethodsForDevice(
  methods: CheckoutPaymentMethod[],
): CheckoutPaymentMethod[] {
  return methods.filter((method) => !method.requiresApplePay || isApplePayDeviceAvailable());
}

export function isCheckoutMethodAvailableFromApi(
  method: CheckoutPaymentMethod,
  availableApiCodes: string[],
): boolean {
  if (availableApiCodes.length === 0) {
    return true;
  }

  const normalizedAvailable = availableApiCodes.map((code) => code.toLowerCase());

  return method.apiCodes.some((code) => normalizedAvailable.includes(code));
}
