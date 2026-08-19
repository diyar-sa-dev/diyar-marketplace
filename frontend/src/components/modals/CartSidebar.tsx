import React, { useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../../hooks/cart/useCart.ts';
import { cartKeys } from '../../hooks/cart/queryKeys.ts';
import { cartSync } from '../../hooks/cart/cartSync.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { CartLineItemCard } from '../checkout/CartLineItemCard.tsx';
import { cartItemToLineProps } from '../../lib/cartLineItem.ts';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatMoney(value: string | number, currency: string): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return `${value} ${currency}`;
  }
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { t, dir } = useLocale();
  const queryClient = useQueryClient();
  const currency = t('vendor.products.table.currency');
  const isRtl = dir === 'rtl';
  const sidebarPosition = isRtl ? 'left-0' : 'right-0';
  const sidebarHiddenTransform = isRtl ? '-translate-x-full' : 'translate-x-full';
  const CheckoutArrow = isRtl ? ArrowLeft : ArrowRight;
  const checkoutArrowHover = isRtl ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1';
  const { items, count, totals, isLoading, updateItemQuantity, removeItem } = useCart();
  const { data: mergeWarnings = [] } = useQuery<string[]>({
    queryKey: cartKeys.mergeWarnings(),
    queryFn: () => [],
    staleTime: Number.POSITIVE_INFINITY,
    initialData: [],
  });

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

  const dismissMergeWarnings = () => {
    queryClient.setQueryData(cartKeys.mergeWarnings(), []);
  };

  const handleQuantityChange = (itemId: string, currentQuantity: number, delta: number) => {
    const nextQuantity = currentQuantity + delta;
    if (nextQuantity < 1) {
      return;
    }

    updateItemQuantity(itemId, nextQuantity);
  };

  const handleRemove = (itemId: string) => {
    removeItem(itemId);
  };

  const pendingCheckoutNote = useMemo(() => t('cart.sidebar.checkoutPendingNote'), [t]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        dir={dir}
        className={`fixed top-0 bottom-0 ${sidebarPosition} w-full md:w-100 bg-white z-70 shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : sidebarHiddenTransform
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-diyar-dark">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-bold">{t('cart.sidebar.title')}</h2>
            {count > 0 && (
              <span className="bg-diyar-brown text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-diyar-dark cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {mergeWarnings.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold mb-1">{t('cart.mergeWarningsTitle')}</p>
                    <ul className="text-xs space-y-1 list-disc ps-4">
                      {mergeWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={dismissMergeWarnings}
                  className="text-amber-700 hover:text-amber-900 p-1 shrink-0 cursor-pointer"
                  aria-label={t('cart.dismissMergeWarnings')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex items-center justify-center text-gray-400 py-16">
              {t('common.loading')}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
              <ShoppingBag size={40} className="mb-4 opacity-40" />
              <p className="font-bold text-diyar-dark mb-1">{t('cart.sidebar.emptyTitle')}</p>
              <p className="text-sm">{t('cart.sidebar.emptyDescription')}</p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 p-3 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <CartLineItemCard {...cartItemToLineProps(item, lineLabels)} compact />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0 self-start cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  <button
                    type="button"
                    disabled={item.quantity <= 1}
                    onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                    className="text-gray-500 hover:text-diyar-brown p-0.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                    className="text-gray-500 hover:text-diyar-brown p-0.5 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 pb-safe">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>{t('cart.sidebar.subtotal')}</span>
              <span className="tabular-nums">{formatMoney(totals.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>{t('cart.sidebar.tax')}</span>
              <span>{t('cart.sidebar.pendingAtCheckout')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>{t('cart.sidebar.shipping')}</span>
              <span>{t('cart.sidebar.pendingAtCheckout')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-diyar-dark mb-4 md:mb-6">
              <span>{t('cart.sidebar.total')}</span>
              <span className="text-sm font-medium text-gray-400">
                {t('cart.sidebar.pendingAtCheckout')}
              </span>
            </div>

            <Link
              to="/checkout"
              onClick={() => {
                void cartSync.flush();
                onClose();
              }}
              className="w-full bg-diyar-dark text-white font-bold py-3.5 md:py-4 rounded-xl shadow-lg shadow-black/10 flex items-center justify-center gap-2 hover:bg-black transition-colors group cursor-pointer"
            >
              {t('cart.sidebar.checkoutCta')}
              <CheckoutArrow className={`w-5 h-5 ${checkoutArrowHover} transition-transform`} />
            </Link>
            <div className="text-center mt-3 text-xs text-gray-400">{pendingCheckoutNote}</div>
          </div>
        )}
      </div>
    </>
  );
}
