import { describe, expect, it } from 'vitest';
import { metersToCanvasPoint } from './projectionMode.ts';

function measureProjectionMs(itemCount: number, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    for (let n = 0; n < itemCount; n += 1) {
      const x = 1 + (n % 10) * 0.5;
      const z = 1 + Math.floor(n / 10) * 0.5;
      metersToCanvasPoint('isometric_25d', x, z, 80);
    }
  }
  return (performance.now() - start) / iterations;
}

describe('perspective25d perf (local smoke)', () => {
  it('projects 100 items under 2ms per batch (dev machine smoke)', () => {
    const counts = [1, 10, 50, 100];
    const timings: Record<number, number> = {};
    for (const count of counts) {
      timings[count] = measureProjectionMs(count, 200);
    }
    expect(timings[100]).toBeLessThan(2);
  });
});
