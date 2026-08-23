import { resolveMediaUrl } from './media.ts';
import type { ProductCard } from '../types/catalog.ts';
import { LOW_STOCK_THRESHOLD } from './stockStatus.ts';

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
  ratingAvg?: number | null;
  reviewsCount?: number;
  loyaltyPoints?: number;
  userSaved?: boolean;
  isOwnStore?: boolean;
}

/** Estimated loyalty earn on purchase: 1 point per N SAR (configurable). */
export function estimateLoyaltyPoints(salePrice: number, sarPerPoint = 50): number {
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return 0;
  }

  const divisor = Number.isFinite(sarPerPoint) && sarPerPoint > 0 ? sarPerPoint : 50;

  return Math.floor(salePrice / divisor);
}

export function mapProductCard(product: ProductCard, sarPerPoint = 50): UiProductCard {
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
    ratingAvg: product.rating_avg ?? null,
    reviewsCount: product.reviews_count ?? 0,
    loyaltyPoints: estimateLoyaltyPoints(salePrice, sarPerPoint),
    userSaved: product.user_saved,
    isOwnStore: product.is_own_store,
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
  if (availableQty <= LOW_STOCK_THRESHOLD) {
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

export function formatCompactProductSize(
  dimensions:
    | {
        width?: string | number | null;
        height?: string | number | null;
        depth?: string | number | null;
      }
    | null
    | undefined,
): string | null {
  if (!dimensions) {
    return null;
  }

  const width =
    dimensions.width != null && dimensions.width !== '' ? String(dimensions.width) : null;
  const height =
    dimensions.height != null && dimensions.height !== '' ? String(dimensions.height) : null;
  const depth =
    dimensions.depth != null && dimensions.depth !== '' ? String(dimensions.depth) : null;

  if (width && height) {
    return `${width}x${height} سم`;
  }

  if (width && depth) {
    return `${width}x${depth} سم`;
  }

  if (height && depth) {
    return `${height}x${depth} سم`;
  }

  if (width) {
    return `${width} سم`;
  }

  if (height) {
    return `${height} سم`;
  }

  if (depth) {
    return `${depth} سم`;
  }

  return null;
}
