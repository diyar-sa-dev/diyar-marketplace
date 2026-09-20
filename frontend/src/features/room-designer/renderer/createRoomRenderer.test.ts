import { describe, expect, it } from 'vitest';
import { createRoomRenderer } from './createRoomRenderer.ts';

describe('createRoomRenderer', () => {
  it('lazy-loads fabric adapter module', async () => {
    const renderer = await createRoomRenderer('top_down');
    expect(renderer.mount).toBeTypeOf('function');
    expect(renderer.render).toBeTypeOf('function');
    renderer.destroy();
  });

  it('lazy-loads three adapter for room_3d', async () => {
    const renderer = await createRoomRenderer('room_3d');
    expect(renderer.constructor.name).toBe('ThreeRoomRenderer');
    renderer.destroy();
  });
});
