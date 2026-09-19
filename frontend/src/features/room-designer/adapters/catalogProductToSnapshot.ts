import type { ProductDetail } from '../../../types/catalog.ts';
import { DomainErrorCode, domainError, type DomainError } from '../domain/errors.ts';
import { isCatalogProductId } from '../domain/productId.ts';
import type { ItemSnapshot } from '../domain/models.ts';
import { centimetersToMeters, roundMeters } from '../domain/units.ts';

/** Default footprint when catalog dimensions are missing (meters). */
export const FALLBACK_FOOTPRINT_M = 1;

function parsePositiveCm(value: string | number | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

export function dimensionsCmToSnapshotMeters(dimensions: ProductDetail['dimensions']): {
  width_m: number;
  depth_m: number;
  height_m: number | null;
  usedFallback: boolean;
} {
  const widthCm = parsePositiveCm(dimensions.width);
  const depthCm = parsePositiveCm(dimensions.depth);
  const heightCm = parsePositiveCm(dimensions.height);

  const usedFallback = widthCm == null || depthCm == null;

  const width_m = roundMeters(
    widthCm != null ? centimetersToMeters(widthCm) : FALLBACK_FOOTPRINT_M,
  );
  const depth_m = roundMeters(
    depthCm != null ? centimetersToMeters(depthCm) : FALLBACK_FOOTPRINT_M,
  );
  const height_m = heightCm != null ? roundMeters(centimetersToMeters(heightCm)) : null;

  return { width_m, depth_m, height_m, usedFallback };
}

export function productDetailToSnapshot(
  product: Pick<ProductDetail, 'name' | 'dimensions' | 'images'>,
): ItemSnapshot {
  const mapped = dimensionsCmToSnapshotMeters(product.dimensions);
  const thumbnail_url = product.images?.[0]?.url ?? null;

  return {
    name: product.name,
    width_m: mapped.width_m,
    depth_m: mapped.depth_m,
    height_m: mapped.height_m,
    thumbnail_url,
    asset_ref: null,
  };
}

export function parseProductId(
  productId: string,
): { ok: true; id: string } | { ok: false; error: DomainError } {
  if (!isCatalogProductId(productId)) {
    return {
      ok: false,
      error: domainError(DomainErrorCode.INVALID_COMMAND, 'Invalid product id', { productId }),
    };
  }
  return { ok: true, id: productId };
}
