import { describe, expect, it } from 'vitest';
import type { ProductDetail } from '../../../types/catalog.ts';
import { executeCommand, createSpatialEngine } from '../application/spatialEngine.ts';
import { centimetersToMeters } from '../domain/units.ts';
import { buildDesignItemFromProduct } from './buildDesignItemFromProduct.ts';
import {
  dimensionsCmToSnapshotMeters,
  FALLBACK_FOOTPRINT_M,
  productDetailToSnapshot,
} from './catalogProductToSnapshot.ts';

function minimalProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    name: 'كنبة',
    slug: 'sofa',
    description: null,
    sale_price: 1000,
    product_type: 'single',
    availability_mode: 'in_stock',
    status: 'published',
    dimensions: { width: 200, height: 85, depth: 90 },
    materials: null,
    warranty: null,
    rating_avg: null,
    reviews_count: 0,
    likes_count: 0,
    ...overrides,
  };
}

describe('catalogProductToSnapshot', () => {
  it('converts cm dimensions to meters', () => {
    const result = dimensionsCmToSnapshotMeters(minimalProduct().dimensions);
    expect(result.width_m).toBe(centimetersToMeters(200));
    expect(result.depth_m).toBe(centimetersToMeters(90));
    expect(result.height_m).toBe(centimetersToMeters(85));
    expect(result.usedFallback).toBe(false);
  });

  it('uses fallback footprint when width or depth missing', () => {
    const result = dimensionsCmToSnapshotMeters({ width: null, height: 80, depth: 100 });
    expect(result.width_m).toBe(FALLBACK_FOOTPRINT_M);
    expect(result.depth_m).toBe(centimetersToMeters(100));
    expect(result.usedFallback).toBe(true);
  });

  it('maps product detail to snapshot without price or stock', () => {
    const snapshot = productDetailToSnapshot({
      ...minimalProduct(),
      images: [{ id: '1', url: 'https://cdn.example/a.webp', sort_order: 0 }],
    });
    expect(snapshot.name).toBe('كنبة');
    expect(snapshot.thumbnail_url).toContain('cdn.example');
    expect(Object.keys(snapshot)).not.toContain('sale_price' as never);
  });

  it('builds ADD_ITEM payload integrated with spatial engine', () => {
    const built = buildDesignItemFromProduct(minimalProduct(), {
      id: 'item-cat-1',
      position_m: { x: 2, z: 2 },
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, { type: 'ADD_ITEM', item: built.item });
    expect(add.ok).toBe(true);
    if (add.ok) {
      expect(add.state.document.items[0]?.snapshot.width_m).toBe(2);
    }
  });

  it('rejects invalid product id', () => {
    const built = buildDesignItemFromProduct(minimalProduct({ id: 'not-a-valid-uuid' }), {
      id: 'x',
      position_m: { x: 1, z: 1 },
    });
    expect(built.ok).toBe(false);
  });
});
