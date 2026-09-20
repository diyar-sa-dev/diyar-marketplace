import { describe, expect, it } from 'vitest';
import {
  canvasPointToMeters,
  metersToCanvasPoint,
  nextPresentationMode,
  rendererBackendKey,
} from './projectionMode.ts';

describe('projectionMode', () => {
  const scale = 80;

  it('top_down matches axis-aligned mapping', () => {
    const px = metersToCanvasPoint('top_down', 2, 3, scale);
    expect(px).toEqual({ x: 160, y: 240 });
    const m = canvasPointToMeters('top_down', 160, 240, scale);
    expect(m).toEqual({ x: 2, z: 3 });
  });

  it('isometric round-trips', () => {
    const px = metersToCanvasPoint('isometric_25d', 1.5, 2.5, scale);
    const m = canvasPointToMeters('isometric_25d', px.x, px.y, scale);
    expect(m.x).toBeCloseTo(1.5, 5);
    expect(m.z).toBeCloseTo(2.5, 5);
  });

  it('selects renderer backend per mode', () => {
    expect(rendererBackendKey('top_down')).toBe('fabric');
    expect(rendererBackendKey('room_3d')).toBe('three');
  });

  it('cycles presentation modes when flags allow', () => {
    expect(
      nextPresentationMode('top_down', { allow25d: true, allow3d: true }),
    ).toBe('isometric_25d');
    expect(
      nextPresentationMode('isometric_25d', { allow25d: true, allow3d: true }),
    ).toBe('room_3d');
    expect(nextPresentationMode('room_3d', { allow25d: true, allow3d: true })).toBe('top_down');
  });
});
