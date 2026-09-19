import { describe, expect, it } from 'vitest';
import { centimetersToMeters, metersToCentimeters, nearlyEqual, roundMeters } from './units.ts';

describe('units', () => {
  it('converts cm to m', () => {
    expect(centimetersToMeters(200)).toBe(2);
    expect(centimetersToMeters(0)).toBe(0);
  });

  it('converts m to cm', () => {
    expect(metersToCentimeters(2)).toBe(200);
  });

  it('round-trips catalog boundary', () => {
    const cm = 185.5;
    expect(metersToCentimeters(centimetersToMeters(cm))).toBe(cm);
  });

  it('compares meters with epsilon', () => {
    expect(nearlyEqual(1, 1 + 1e-7)).toBe(true);
    expect(nearlyEqual(1, 1.001)).toBe(false);
  });

  it('rounds meters for serialization stability', () => {
    expect(roundMeters(1.234567891)).toBe(1.234568);
  });
});
