import { describe, expect, it } from 'vitest';
import { isAllowedGlbHttpUrl, resolveGlbAssetUrl, TIER3_GLB_PREFIX } from './resolveGlbAssetUrl.ts';

describe('resolveGlbAssetUrl', () => {
  it('allows tier3 https URLs only', () => {
    const url = `${TIER3_GLB_PREFIX}https://cdn.example/model.glb`;
    expect(resolveGlbAssetUrl({ name: 'S', width_m: 1, depth_m: 1, asset_ref: url })).toBe(
      'https://cdn.example/model.glb',
    );
  });

  it('rejects javascript and data schemes', () => {
    expect(isAllowedGlbHttpUrl('javascript:alert(1)')).toBe(false);
    expect(
      resolveGlbAssetUrl({
        name: 'S',
        width_m: 1,
        depth_m: 1,
        asset_ref: `${TIER3_GLB_PREFIX}javascript:x`,
      }),
    ).toBeNull();
  });
});
