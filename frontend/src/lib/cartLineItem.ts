import type { CartItem } from '../types/cart.ts';

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
    colorLabel: labels.colorLabel,
    sizeLabel: labels.sizeLabel,
    quantityLabel: labels.quantityLabel,
  };
}
