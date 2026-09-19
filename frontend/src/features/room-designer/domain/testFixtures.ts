import type { RoomDesignItem } from './models.ts';

export function makeItem(overrides: Partial<RoomDesignItem> = {}): RoomDesignItem {
  const base: RoomDesignItem = {
    id: 'item-1',
    product_id: '550e8400-e29b-41d4-a716-446655440042',
    position_m: { x: 2, z: 2 },
    rotation_deg: 0,
    locked: false,
    layer: 0,
    snapshot: {
      name: 'Sofa',
      width_m: 2,
      depth_m: 1,
    },
  };

  return {
    ...base,
    ...overrides,
    position_m: overrides.position_m ?? base.position_m,
    snapshot: { ...base.snapshot, ...overrides.snapshot },
  };
}
