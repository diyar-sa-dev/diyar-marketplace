import type { ProductDetail } from '../../../types/catalog.ts';
import type { DomainError } from '../domain/errors.ts';
import type { PositionM, RoomDesignItem } from '../domain/models.ts';
import { parseProductId, productDetailToSnapshot } from './catalogProductToSnapshot.ts';

export interface BuildDesignItemOptions {
  id: string;
  position_m: PositionM;
  variant_key?: string | null;
  layer?: number;
}

export function buildDesignItemFromProduct(
  product: ProductDetail,
  options: BuildDesignItemOptions,
): { ok: true; item: RoomDesignItem } | { ok: false; error: DomainError } {
  const parsedId = parseProductId(product.id);
  if (parsedId.ok === false) {
    return parsedId;
  }

  const item: RoomDesignItem = {
    id: options.id,
    product_id: parsedId.id,
    variant_key: options.variant_key ?? null,
    position_m: { ...options.position_m },
    rotation_deg: 0,
    locked: false,
    layer: options.layer ?? 0,
    snapshot: productDetailToSnapshot(product),
  };

  return { ok: true, item };
}
