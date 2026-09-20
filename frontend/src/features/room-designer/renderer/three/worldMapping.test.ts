import { describe, expect, it } from 'vitest';
import { makeItem } from '../../domain/testFixtures.ts';
import { createEmptyDocument } from '../../domain/models.ts';
import {
  itemCenterToThreeMeters,
  itemRotationYRadians,
  itemSizeToThreeMeters,
  roomCenterMeters,
} from './worldMapping.ts';

describe('worldMapping (domain → Three.js)', () => {
  it('maps item center X/Z to Three X/Z and height to Y', () => {
    const item = makeItem({
      position_m: { x: 2, z: 3 },
      snapshot: { name: 'S', width_m: 1, depth_m: 1, height_m: 0.8 },
    });
    const v = itemCenterToThreeMeters(item);
    expect(v.x).toBe(2);
    expect(v.z).toBe(3);
    expect(v.y).toBeCloseTo(0.4, 5);
  });

  it('uses catalog width/depth/height for box size', () => {
    const item = makeItem({
      snapshot: { name: 'S', width_m: 2, depth_m: 0.5, height_m: 1 },
    });
    expect(itemSizeToThreeMeters(item)).toEqual({ x: 2, y: 1, z: 0.5 });
  });

  it('normalizes rotation to radians on Y', () => {
    const item = makeItem({ rotation_deg: 405 });
    expect(itemRotationYRadians(item)).toBeCloseTo(Math.PI / 4, 5);
  });

  it('room center uses meters midpoints', () => {
    const doc = createEmptyDocument(4, 6, 2.4);
    const c = roomCenterMeters(doc.room);
    expect(c.x).toBe(2);
    expect(c.z).toBe(3);
    expect(c.y).toBeCloseTo(1.2, 5);
  });
});
