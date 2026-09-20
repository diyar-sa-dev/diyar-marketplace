import { describe, expect, it } from 'vitest';
import {
  isAllowedTier2HttpUrl,
  resolveItemRenderImageUrl,
  TIER2_ASSET_PREFIX,
} from './itemDisplayAsset.ts';

describe('resolveItemRenderImageUrl', () => {
  it('returns null in top_down mode', () => {
    expect(
      resolveItemRenderImageUrl(
        { name: 'Sofa', width_m: 1, depth_m: 1, thumbnail_url: 'https://cdn/x.webp' },
        'top_down',
      ),
    ).toBeNull();
  });

  it('uses tier2 http ref in isometric mode', () => {
    const url = `${TIER2_ASSET_PREFIX}https://cdn.example/isometric.webp`;
    expect(
      resolveItemRenderImageUrl(
        { name: 'Sofa', width_m: 1, depth_m: 1, asset_ref: url },
        'isometric_25d',
      ),
    ).toBe('https://cdn.example/isometric.webp');
  });

  it('rejects dangerous tier2 URL schemes', () => {
    expect(isAllowedTier2HttpUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedTier2HttpUrl('data:text/html,x')).toBe(false);
    expect(
      resolveItemRenderImageUrl(
        {
          name: 'Sofa',
          width_m: 1,
          depth_m: 1,
          asset_ref: `${TIER2_ASSET_PREFIX}javascript:evil()`,
        },
        'isometric_25d',
      ),
    ).toBeNull();
  });

  it('falls back to thumbnail for tier2 media ref', () => {
    expect(
      resolveItemRenderImageUrl(
        {
          name: 'Sofa',
          width_m: 1,
          depth_m: 1,
          asset_ref: `${TIER2_ASSET_PREFIX}media:uuid`,
          thumbnail_url: 'https://cdn/thumb.webp',
        },
        'isometric_25d',
      ),
    ).toBe('https://cdn/thumb.webp');
  });
});
