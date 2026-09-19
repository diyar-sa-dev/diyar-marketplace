const FULL_CIRCLE = 360;

/** Normalize to [0, 360). */
export function normalizeRotationDeg(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  const mod = degrees % FULL_CIRCLE;
  return mod < 0 ? mod + FULL_CIRCLE : mod;
}

export function rotationRadians(degrees: number): number {
  return (normalizeRotationDeg(degrees) * Math.PI) / 180;
}
