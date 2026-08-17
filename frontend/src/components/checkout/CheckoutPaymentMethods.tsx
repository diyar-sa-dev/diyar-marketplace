import React from 'react';
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
};

export function CheckoutPaymentMethods({ selected, onChange, disabled = false }: CheckoutPaymentMethodsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {CHECKOUT_PAYMENT_METHODS.map((method) => {
        const isSelected = selected === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method.id)}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all min-h-[6rem] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? 'border-diyar-brown bg-diyar-brown/5 ring-1 ring-diyar-brown/20'
                : 'border-gray-100 hover:border-gray-200 bg-white'
            }`}
          >
            <div className="h-10 flex items-center justify-center w-full">
              {method.type === 'image' && method.logo ? (
                <div className="relative h-full flex items-center justify-center w-full">
                  <img
                    src={method.logo}
                    alt={t(method.labelKey)}
                    className="max-h-full max-w-[90px] object-contain"
                    onError={(event) => {
                      const target = event.currentTarget;
                      target.style.display = 'none';
                      target.parentElement?.querySelector('.payment-fallback')?.classList.remove('hidden');
                    }}
                  />
                  <div className="payment-fallback hidden flex flex-col items-center">
                    {method.id === 'apple' ? (
                      <span className="text-sm font-bold">Apple Pay</span>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">{t(method.labelKey)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <CreditCard className="w-8 h-8 text-gray-700" aria-hidden="true" />
              )}
            </div>
            <span className="text-[10px] md:text-xs font-bold text-diyar-dark text-center leading-snug">
              {t(method.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
