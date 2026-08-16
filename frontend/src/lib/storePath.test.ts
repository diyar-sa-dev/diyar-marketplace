import { describe, expect, it } from 'vitest';
import { isValidStoreSlug, storePath } from './storePath.ts';

describe('storePath', () => {
  it('rejects null-like slugs', () => {
    expect(isValidStoreSlug(null)).toBe(false);
    expect(isValidStoreSlug(undefined)).toBe(false);
    expect(isValidStoreSlug('null')).toBe(false);
    expect(isValidStoreSlug('')).toBe(false);
  });

  it('builds store path for valid slug', () => {
    expect(storePath('diyar-furniture')).toBe('/store/diyar-furniture');
    expect(storePath(null)).toBeNull();
  });
});
