/**
 * Deterministic 2.5D (dimetric) projection — presentation only; world stays X/Z meters.
 * RTL-neutral: UI mirrors separately; canvas math is fixed.
 */

export const ISO_X = Math.cos(Math.PI / 6);
export const ISO_Y = Math.sin(Math.PI / 6);

export interface CanvasPointPx {
  x: number;
  y: number;
}

export function metersToIsometricCanvasPoint(
  x_m: number,
  z_m: number,
  scalePxPerM: number,
): CanvasPointPx {
  if (!Number.isFinite(x_m) || !Number.isFinite(z_m) || !Number.isFinite(scalePxPerM)) {
    return { x: 0, y: 0 };
  }
  return {
    x: (x_m - z_m) * ISO_X * scalePxPerM,
    y: (x_m + z_m) * ISO_Y * scalePxPerM,
  };
}

export function isometricCanvasPointToMeters(
  xPx: number,
  yPx: number,
  scalePxPerM: number,
): { x: number; z: number } {
  if (
    !Number.isFinite(xPx) ||
    !Number.isFinite(yPx) ||
    !Number.isFinite(scalePxPerM) ||
    scalePxPerM === 0
  ) {
    return { x: 0, z: 0 };
  }
  const a = xPx / (ISO_X * scalePxPerM);
  const b = yPx / (ISO_Y * scalePxPerM);
  return { x: (a + b) / 2, z: (b - a) / 2 };
}

/** Room floor corners in world meters (corner origin). */
export function roomFloorCornersMeters(width_m: number, depth_m: number): Array<{ x: number; z: number }> {
  return [
    { x: 0, z: 0 },
    { x: width_m, z: 0 },
    { x: width_m, z: depth_m },
    { x: 0, z: depth_m },
  ];
}

export function projectRoomFloorToCanvas(
  width_m: number,
  depth_m: number,
  scalePxPerM: number,
): CanvasPointPx[] {
  return roomFloorCornersMeters(width_m, depth_m).map((c) =>
    metersToIsometricCanvasPoint(c.x, c.z, scalePxPerM),
  );
}

/** Center-anchored footprint sizes for Fabric rect in isometric view. */
export function itemFootprintIsometricPx(
  width_m: number,
  depth_m: number,
  scalePxPerM: number,
): { widthPx: number; heightPx: number } {
  const w0 = metersToIsometricCanvasPoint(width_m, 0, scalePxPerM);
  const w1 = metersToIsometricCanvasPoint(0, 0, scalePxPerM);
  const d0 = metersToIsometricCanvasPoint(0, depth_m, scalePxPerM);
  const d1 = metersToIsometricCanvasPoint(0, 0, scalePxPerM);
  const widthPx = Math.hypot(w0.x - w1.x, w0.y - w1.y);
  const heightPx = Math.hypot(d0.x - d1.x, d0.y - d1.y);
  return {
    widthPx: Number.isFinite(widthPx) ? widthPx : 0,
    heightPx: Number.isFinite(heightPx) ? heightPx : 0,
  };
}

/** Presentation-only vertical lift from catalog height (not persisted). */
export function elevationScreenOffsetPx(height_m: number | null | undefined, scalePxPerM: number): number {
  const h = height_m ?? 0;
  if (!Number.isFinite(h) || h <= 0) {
    return 0;
  }
  return h * scalePxPerM * ISO_Y * 0.35;
}
