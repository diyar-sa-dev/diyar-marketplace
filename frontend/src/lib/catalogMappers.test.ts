import { describe, expect, it } from 'vitest';
import {
  availabilityLabel,
  estimateLoyaltyPoints,
  formatCompactProductSize,
  mapProductCard,
} from './catalogMappers.ts';
import type { ProductCard } from '../types/catalog.ts';

const baseProduct: ProductCard = {
  id: '1',
  name: 'كنبة ثلاثية',
  slug: 'sofa',
  sale_price: 1899,
  compare_price: 2199,
  availability_mode: 'in_stock',
  image_url: '/storage/products/sofa.jpg',
  vendor: { store_name: 'متجر ديار', slug: 'diyar-furniture' },
  category: { name: 'الصالونات', slug: 'living-room' },
  inventory: { available_quantity: 12 },
};

describe('mapProductCard', () => {
  it('maps API product card to UI shape with discount', () => {
    const mapped = mapProductCard(baseProduct);

    expect(mapped.id).toBe('1');
    expect(mapped.name).toBe('كنبة ثلاثية');
    expect(mapped.price).toBe(1899);
    expect(mapped.oldPrice).toBe(2199);
    expect(mapped.discountPercent).toBe(14);
    expect(mapped.vendor).toBe('متجر ديار');
    expect(mapped.availabilityMode).toBe('in_stock');
    expect(mapped.availableQuantity).toBe(12);
    expect(mapped.loyaltyPoints).toBe(37);
  });

  it('uses server loyalty estimate when provided', () => {
    const mapped = mapProductCard({ ...baseProduct, loyalty_points_estimate: 42 });

    expect(mapped.loyaltyPoints).toBe(42);
    expect(mapped.loyalty_points_estimate).toBe(42);
  });

  it('omits old price when there is no discount', () => {
    const mapped = mapProductCard({
      ...baseProduct,
      compare_price: null,
    });

    expect(mapped.oldPrice).toBeUndefined();
    expect(mapped.discountPercent).toBeUndefined();
  });
});

describe('estimateLoyaltyPoints', () => {
  it('awards 1 point per 50 SAR by default', () => {
    expect(estimateLoyaltyPoints(2499)).toBe(49);
    expect(estimateLoyaltyPoints(1100)).toBe(22);
    expect(estimateLoyaltyPoints(3200)).toBe(64);
  });

  it('respects admin sar per point and points per unit', () => {
    expect(estimateLoyaltyPoints(100, 50, 2)).toBe(4);
    expect(estimateLoyaltyPoints(100, 25, 1)).toBe(4);
  });
});

describe('availabilityLabel', () => {
  it('returns preorder label', () => {
    expect(availabilityLabel('preorder')).toBe('طلب مسبق');
  });

  it('returns out of stock label', () => {
    expect(availabilityLabel('out_of_stock', 0)).toBe('غير متوفر');
  });

  it('returns limited quantity label', () => {
    expect(availabilityLabel('in_stock', 3)).toBe('كمية محدودة');
  });

  it('returns in stock label', () => {
    expect(availabilityLabel('in_stock', 20)).toBe('متوفر');
  });
});

describe('formatCompactProductSize', () => {
  it('returns width x height when both exist', () => {
    expect(formatCompactProductSize({ width: 80, height: 120, depth: null })).toBe('80x120 سم');
  });

  it('returns null when no dimensions', () => {
    expect(formatCompactProductSize(null)).toBeNull();
  });
});
