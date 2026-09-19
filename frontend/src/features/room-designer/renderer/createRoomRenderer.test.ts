import { describe, expect, it } from 'vitest';
import { createRoomRenderer } from './createRoomRenderer.ts';

describe('createRoomRenderer', () => {
  it('lazy-loads fabric adapter module', async () => {
    const renderer = await createRoomRenderer();
    expect(renderer.mount).toBeTypeOf('function');
    expect(renderer.render).toBeTypeOf('function');
    renderer.destroy();
  });
});
