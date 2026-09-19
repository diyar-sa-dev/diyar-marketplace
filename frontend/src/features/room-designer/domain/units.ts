import { METER_EPSILON } from './constants.ts';

const CM_PER_M = 100;

/** Catalog boundary: centimeters → canonical meters. */
export function centimetersToMeters(cm: number): number {
  return cm / CM_PER_M;
}

/** Presentation / API boundary: meters → centimeters. */
export function metersToCentimeters(m: number): number {
  return m * CM_PER_M;
}

/** Round meters for stable serialization (µm precision). */
export function roundMeters(m: number): number {
  return Math.round(m * 1_000_000) / 1_000_000;
}

export function nearlyEqual(a: number, b: number, epsilon = METER_EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}
