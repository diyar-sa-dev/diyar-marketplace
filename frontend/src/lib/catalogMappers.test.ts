import { describe, expect, it } from 'vitest';
import { availabilityLabel, mapProductCard } from './catalogMappers.ts';
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
