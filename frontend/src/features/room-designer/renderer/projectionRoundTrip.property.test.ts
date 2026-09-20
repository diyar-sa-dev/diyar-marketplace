import { describe, expect, it } from 'vitest';
import { canvasPointToMeters, metersToCanvasPoint, type RoomProjectionMode } from './projectionMode.ts';

const MODES: RoomProjectionMode[] = ['top_down', 'isometric_25d'];
const SCALES = [20, 80, 160, 320];
const TOL_M = 1e-4;

function roundTrip(mode: RoomProjectionMode, x: number, z: number, scale: number) {
  const px = metersToCanvasPoint(mode, x, z, scale);
  return canvasPointToMeters(mode, px.x, px.y, scale);
}

describe('projection round-trip property', () => {
  it('preserves world X/Z within tolerance for grid of points and scales', () => {
    const coords = [0, 0.1, 1, 2.5, 5, 12.5, 29.9];
    for (const mode of MODES) {
      for (const scale of SCALES) {
        for (const x of coords) {
          for (const z of coords) {
            const back = roundTrip(mode, x, z, scale);
            expect(back.x).toBeCloseTo(x, 4);
            expect(back.z).toBeCloseTo(z, 4);
          }
        }
      }
    }
  });

  it('handles negative world coordinates in top_down', () => {
    const back = roundTrip('top_down', -1.25, -0.5, 80);
    expect(Math.abs(back.x - -1.25)).toBeLessThan(TOL_M);
    expect(Math.abs(back.z - -0.5)).toBeLessThan(TOL_M);
  });

  it('returns zero world coords for non-finite screen input', () => {
    expect(canvasPointToMeters('top_down', Number.NaN, 10, 80)).toEqual({ x: 0, z: 0 });
    expect(canvasPointToMeters('isometric_25d', 10, Number.POSITIVE_INFINITY, 80)).toEqual({
      x: 0,
      z: 0,
    });
  });
});
