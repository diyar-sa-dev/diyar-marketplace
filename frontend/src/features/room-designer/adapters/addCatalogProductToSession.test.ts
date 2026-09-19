import { describe, expect, it, vi } from 'vitest';
import type { ProductDetail } from '../../../types/catalog.ts';
import { DesignerSession } from '../application/DesignerSession.ts';
import { createSpatialEngine } from '../application/spatialEngine.ts';
import { isCatalogProductId } from '../domain/productId.ts';
import { addCatalogProductToSession } from './addCatalogProductToSession.ts';

const PRODUCT_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function mockProduct(): ProductDetail {
  return {
    id: PRODUCT_ID,
    name: 'Table',
    slug: 'table',
    description: null,
    sale_price: 500,
    product_type: 'single',
    availability_mode: 'in_stock',
    status: 'published',
    dimensions: { width: 120, height: 75, depth: 80 },
    materials: null,
    warranty: null,
    rating_avg: null,
    reviews_count: 0,
    likes_count: 0,
  };
}

describe('addCatalogProductToSession', () => {
  it('loads product, builds snapshot, and ADD_ITEM with UUID', async () => {
    const fetchProductFn = vi.fn().mockResolvedValue(mockProduct());
    const engine = createSpatialEngine(5, 5);
    const session = new DesignerSession(engine);

    const result = await addCatalogProductToSession(session, PRODUCT_ID, fetchProductFn);
    expect(result.ok).toBe(true);
    expect(fetchProductFn).toHaveBeenCalledWith(PRODUCT_ID);

    const item = session.getDocument().items[0];
    expect(item?.product_id).toBe(PRODUCT_ID);
    expect(isCatalogProductId(item?.product_id)).toBe(true);
    expect(item?.snapshot.width_m).toBeCloseTo(1.2, 3);
  });
});
