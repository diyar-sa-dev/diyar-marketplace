import { resolveMediaUrl } from './media.ts';
import type { ProductCard } from '../types/catalog.ts';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';

export interface UiProductCard {
  id: string;
  name: string;
  img: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  vendor?: string;
  store?: string;
  category?: string;
  availabilityMode?: string;
  availableQuantity?: number;
  userSaved?: boolean;
}

export function mapProductCard(product: ProductCard): UiProductCard {
  const salePrice = Number(product.sale_price);
  const comparePrice = product.compare_price != null ? Number(product.compare_price) : undefined;
  const discountPercent =
    product.discount_percent ??
    (comparePrice && comparePrice > salePrice
      ? Math.round(((comparePrice - salePrice) / comparePrice) * 100)
      : undefined);

  return {
    id: product.id,
    name: product.name,
    img: resolveMediaUrl(product.image_url) ?? PLACEHOLDER_IMAGE,
    price: salePrice,
    oldPrice: comparePrice && comparePrice > salePrice ? comparePrice : undefined,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : undefined,
    vendor: product.vendor?.store_name,
    store: product.vendor?.store_name,
    category: product.category?.name,
    availabilityMode: product.availability_mode,
    availableQuantity: product.inventory?.available_quantity,
    userSaved: product.user_saved,
  };
}

export interface AvailabilityLabels {
  preorder: string;
  outOfStock: string;
  limited: string;
  inStock: string;
}

const DEFAULT_AVAILABILITY_LABELS: AvailabilityLabels = {
  preorder: 'طلب مسبق',
  outOfStock: 'غير متوفر',
  limited: 'كمية محدودة',
  inStock: 'متوفر',
};

export type AvailabilityTone = 'preorder' | 'out' | 'limited' | 'in_stock';

export function availabilityTone(mode: string, availableQty = 0): AvailabilityTone {
  if (mode === 'preorder') {
    return 'preorder';
  }
  if (mode === 'out_of_stock' || availableQty === 0) {
    return 'out';
  }
  if (availableQty <= 5) {
    return 'limited';
  }
  return 'in_stock';
}

export function availabilityLabel(
  mode: string,
  availableQty?: number,
  labels: AvailabilityLabels = DEFAULT_AVAILABILITY_LABELS,
): string {
  const tone = availabilityTone(mode, availableQty ?? 0);
  if (tone === 'preorder') {
    return labels.preorder;
  }
  if (tone === 'out') {
    return labels.outOfStock;
  }
  if (tone === 'limited') {
    return labels.limited;
  }
  return labels.inStock;
}

export function productTypeLabel(type: string): string {
  return type === 'bundle' ? 'مجموعة' : 'مفرد';
}

export function formatDimension(value: string | number | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  return `${value} سم`;
}
