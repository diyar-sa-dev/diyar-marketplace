export type CheckoutPaymentMethodId = 'mada' | 'visa' | 'apple' | 'tabby';

export type CheckoutPaymentMethod = {
  id: CheckoutPaymentMethodId;
  labelKey: `checkout.paymentMethods.${'mada' | 'card' | 'applePay' | 'tabby'}`;
  logo?: string;
  type: 'image' | 'icon';
  /** Gateway method codes that map to this option (MyFatoorah + normalized backend codes). */
  apiCodes: string[];
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
    id: 'visa',
    labelKey: 'checkout.paymentMethods.card',
    type: 'icon',
    apiCodes: ['visa_master', 'vm', 'visa', 'master', 'creditcard'],
  },
  {
    id: 'apple',
    labelKey: 'checkout.paymentMethods.applePay',
    logo: '/payment-methods/Apple_Pay_logo.svg',
    type: 'image',
    apiCodes: ['apple_pay', 'ap'],
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

export function readStoredPaymentMethod(): CheckoutPaymentMethodId | null {
  const value = sessionStorage.getItem(CHECKOUT_PAYMENT_METHOD_STORAGE_KEY);
  if (value === 'mada' || value === 'visa' || value === 'apple' || value === 'tabby') {
    return value;
  }
  return null;
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

export function resolveApiCodeForPaymentMethod(
  methodId: CheckoutPaymentMethodId,
  availableCodes: string[],
): string | null {
  const method = CHECKOUT_PAYMENT_METHODS.find((entry) => entry.id === methodId);
  if (!method) {
    return null;
  }

  const normalizedAvailable = availableCodes.map((code) => code.toLowerCase());
  return method.apiCodes.find((code) => normalizedAvailable.includes(code)) ?? null;
}
