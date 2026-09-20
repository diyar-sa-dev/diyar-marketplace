import { describe, expect, it } from 'vitest';
import { resolveArAssetUrl } from './resolveArAssetUrl.ts';

describe('resolveArAssetUrl (30.17)', () => {
  it('accepts tier4 https URLs', () => {
    expect(resolveArAssetUrl('tier4:https://cdn.example.com/chair.usdz')).toBe(
      'https://cdn.example.com/chair.usdz',
    );
  });

  it('rejects non-http schemes', () => {
    expect(resolveArAssetUrl('tier4:javascript:alert(1)')).toBeNull();
  });
});
