import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import {
  CHECKOUT_PAYMENT_METHODS,
  type CheckoutPaymentMethodId,
} from '../../lib/paymentMethods.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type CheckoutPaymentMethodsProps = {
  selected: CheckoutPaymentMethodId;
  onChange: (id: CheckoutPaymentMethodId) => void;
  disabled?: boolean;
  methods?: typeof CHECKOUT_PAYMENT_METHODS;
  disabledMethodIds?: CheckoutPaymentMethodId[];
};

type PaymentMethodLogoProps = {
  logo: string;
  label: string;
};

function PaymentMethodLogo({ logo, label }: PaymentMethodLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-xs font-medium text-gray-500">{label}</span>;
  }

  return (
    <img
      src={logo}
      alt=""
      aria-hidden="true"
      className="max-h-full max-w-22.5 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function CheckoutPaymentMethods({
  selected,
  onChange,
  disabled = false,
  methods = CHECKOUT_PAYMENT_METHODS,
  disabledMethodIds = [],
}: CheckoutPaymentMethodsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {methods.map((method) => {
        const isSelected = selected === method.id;
        const isMethodDisabled = disabled || disabledMethodIds.includes(method.id);
        const label = t(method.labelKey);

        return (
          <button
            key={method.id}
            type="button"
            disabled={isMethodDisabled}
            onClick={() => onChange(method.id)}
            aria-label={label}
            className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 p-3 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? 'border-diyar-brown bg-diyar-brown/5 ring-1 ring-diyar-brown/20'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="flex h-10 w-full items-center justify-center">
              {method.type === 'image' && method.logo ? (
                <PaymentMethodLogo logo={method.logo} label={label} />
              ) : (
                <CreditCard className="h-8 w-8 text-gray-700" aria-hidden="true" />
              )}
            </div>
            <span className="text-center text-[10px] font-bold leading-snug text-diyar-dark md:text-xs">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
