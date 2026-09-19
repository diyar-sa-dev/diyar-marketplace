import { describe, expect, it } from 'vitest';
import { defaultAddPosition } from './defaultPlacement.ts';

describe('defaultAddPosition', () => {
  it('places at room center for first item', () => {
    const pos = defaultAddPosition({ width_m: 4, depth_m: 6 }, 0);
    expect(pos).toEqual({ x: 2, z: 3 });
  });

  it('offsets deterministically for subsequent items', () => {
    const room = { width_m: 4, depth_m: 4 };
    const a = defaultAddPosition(room, 0);
    const b = defaultAddPosition(room, 1);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.z).toBe(a.z);
  });
});
