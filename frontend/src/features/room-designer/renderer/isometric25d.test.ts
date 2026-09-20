import { describe, expect, it } from 'vitest';
import {
  isometricCanvasPointToMeters,
  metersToIsometricCanvasPoint,
  projectRoomFloorToCanvas,
} from './isometric25d.ts';

describe('isometric25d projection', () => {
  const scale = 80;

  it('round-trips world center through canvas', () => {
    const world = { x: 3.25, z: 2.75 };
    const px = metersToIsometricCanvasPoint(world.x, world.z, scale);
    const back = isometricCanvasPointToMeters(px.x, px.y, scale);
    expect(back.x).toBeCloseTo(world.x, 5);
    expect(back.z).toBeCloseTo(world.z, 5);
  });

  it('returns zero for invalid scale on inverse', () => {
    expect(isometricCanvasPointToMeters(100, 200, 0)).toEqual({ x: 0, z: 0 });
    expect(isometricCanvasPointToMeters(100, 200, Number.NaN)).toEqual({ x: 0, z: 0 });
  });

  it('projects room floor with four finite corners', () => {
    const corners = projectRoomFloorToCanvas(4, 5, scale);
    expect(corners).toHaveLength(4);
    for (const c of corners) {
      expect(Number.isFinite(c.x)).toBe(true);
      expect(Number.isFinite(c.y)).toBe(true);
    }
  });

  it('does not produce NaN for zero-size room', () => {
    const corners = projectRoomFloorToCanvas(0, 0, scale);
    expect(corners.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y))).toBe(true);
  });
});
