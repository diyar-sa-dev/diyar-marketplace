import { describe, expect, it } from 'vitest';
import { normalizeRotationDeg } from './rotation.ts';

describe('normalizeRotationDeg', () => {
  it('normalizes cardinal angles', () => {
    expect(normalizeRotationDeg(0)).toBe(0);
    expect(normalizeRotationDeg(90)).toBe(90);
    expect(normalizeRotationDeg(180)).toBe(180);
    expect(normalizeRotationDeg(270)).toBe(270);
  });

  it('normalizes beyond 360 and negative values', () => {
    expect(normalizeRotationDeg(720)).toBe(0);
    expect(normalizeRotationDeg(-90)).toBe(270);
    expect(normalizeRotationDeg(450)).toBe(90);
  });

  it('returns 0 for non-finite input', () => {
    expect(normalizeRotationDeg(Number.NaN)).toBe(0);
    expect(normalizeRotationDeg(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
