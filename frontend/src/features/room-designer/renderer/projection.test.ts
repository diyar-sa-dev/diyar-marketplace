import { describe, expect, it } from 'vitest';
import { canvasPointToMeters, itemFootprintTopLeftPx, metersToCanvasPoint } from './projection.ts';

describe('projection', () => {
  it('maps meters to canvas at fixed scale', () => {
    expect(metersToCanvasPoint(2, 3, 100)).toEqual({ x: 200, y: 300 });
  });

  it('round-trips canvas to meters', () => {
    const m = canvasPointToMeters(150, 250, 50);
    expect(m.x).toBe(3);
    expect(m.z).toBe(5);
  });

  it('places centered item footprint from DEC-006 anchor', () => {
    const box = itemFootprintTopLeftPx({ x: 2, z: 2 }, 2, 1, 100);
    expect(box.left).toBe(100);
    expect(box.top).toBe(150);
    expect(box.widthPx).toBe(200);
    expect(box.heightPx).toBe(100);
  });
});
