import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatCompactProductSize } from '../../lib/catalogMappers.ts';
import type { CartItem, CartProductSnapshot } from '../../types/cart.ts';

type CartLineItemCardProps = {
  name: string;
  imageUrl?: string | null;
  vendorName?: string | null;
  color?: { name: string; hex_code: string } | null;
  product?: CartProductSnapshot | null;
  unitPrice: string;
  quantity: number;
  currency: string;
  productFallbackLabel: string;
  colorLabel: string;
  sizeLabel: string;
  quantityLabel: string;
  compact?: boolean;
};

export function CartLineItemCard({
  name,
  imageUrl,
  vendorName,
  color,
  product,
  unitPrice,
  quantity,
  currency,
  productFallbackLabel,
  colorLabel,
  sizeLabel,
  quantityLabel,
  compact = false,
}: CartLineItemCardProps) {
  const sizeText = formatCompactProductSize(product?.dimensions ?? null);
  const imageSize = compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-24 h-24 md:w-28 md:h-28';

  return (
    <div className="flex gap-4">
      <div
        className={`${imageSize} rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gray-50 border border-gray-100`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <ShoppingBag size={compact ? 28 : 32} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-diyar-dark line-clamp-2 ${compact ? 'text-sm md:text-base' : 'text-base'}`}>
          {name}
        </h4>
        {vendorName && <p className="text-xs text-gray-400 mt-0.5 truncate">{vendorName}</p>}

        <div className="mt-2 space-y-1">
          {color && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-gray-500">{colorLabel}:</span>
              <span
                className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
                style={{ backgroundColor: color.hex_code }}
                aria-hidden="true"
              />
              <span>{color.name}</span>
            </div>
          )}
          {sizeText && (
            <p className="text-xs text-gray-600">
              <span className="text-gray-500">{sizeLabel}:</span> {sizeText}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-diyar-dark tabular-nums">
            {unitPrice} {currency}
          </span>
          <span className="text-xs text-gray-500">
            {quantityLabel}: <span className="font-bold text-diyar-dark tabular-nums">{quantity}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function cartItemToLineProps(
  item: CartItem,
  labels: {
    productFallback: string;
    colorLabel: string;
    sizeLabel: string;
    quantityLabel: string;
    currency: string;
  },
) {
  const product = item.product;

  return {
    name: product?.name ?? labels.productFallback,
    imageUrl: product?.image_url,
    vendorName: product?.vendor?.store_name ?? null,
    color: item.color,
    product,
    unitPrice: item.unit_price_snapshot,
    quantity: item.quantity,
    currency: labels.currency,
    productFallbackLabel: labels.productFallback,
    colorLabel: labels.colorLabel,
    sizeLabel: labels.sizeLabel,
    quantityLabel: labels.quantityLabel,
  };
}
