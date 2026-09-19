import { describe, expect, it } from 'vitest';
import { isCatalogProductId } from './productId.ts';

describe('isCatalogProductId', () => {
  it('accepts lowercase UUID', () => {
    expect(isCatalogProductId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects numeric legacy ids', () => {
    expect(isCatalogProductId(42)).toBe(false);
    expect(isCatalogProductId('101')).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(isCatalogProductId('not-a-uuid')).toBe(false);
    expect(isCatalogProductId('')).toBe(false);
  });
});
