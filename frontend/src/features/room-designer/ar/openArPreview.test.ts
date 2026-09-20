import { afterEach, describe, expect, it } from 'vitest';
import { openArPreviewForAssetRef } from './openArPreview.ts';

describe('openArPreviewForAssetRef (30.17)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('rejects invalid asset refs', async () => {
    const result = await openArPreviewForAssetRef('tier2:https://x/y.png');
    expect(result.ok).toBe(false);
  });

  it('opens rel=ar anchor for usdz', async () => {
    const result = await openArPreviewForAssetRef('tier4:https://cdn.example.com/a.usdz');
    expect(result.ok).toBe(true);
  });
});
