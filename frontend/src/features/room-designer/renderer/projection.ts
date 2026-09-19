/**
 * World X/Z (meters) → canvas pixels. RTL-neutral; UI mirrors separately.
 * Canvas vertical axis maps world Z (depth).
 */
export interface CanvasPointPx {
  x: number;
  y: number;
}

export function metersToCanvasPoint(x_m: number, z_m: number, scalePxPerM: number): CanvasPointPx {
  return {
    x: x_m * scalePxPerM,
    y: z_m * scalePxPerM,
  };
}

/** Top-left of axis-aligned footprint for centered item position (DEC-006). */
export function itemFootprintTopLeftPx(
  position_m: { x: number; z: number },
  width_m: number,
  depth_m: number,
  scalePxPerM: number,
): { left: number; top: number; widthPx: number; heightPx: number } {
  const center = metersToCanvasPoint(position_m.x, position_m.z, scalePxPerM);
  const widthPx = width_m * scalePxPerM;
  const heightPx = depth_m * scalePxPerM;
  return {
    left: center.x - widthPx / 2,
    top: center.y - heightPx / 2,
    widthPx,
    heightPx,
  };
}

export function canvasPointToMeters(xPx: number, yPx: number, scalePxPerM: number): { x: number; z: number } {
  if (scalePxPerM === 0) {
    return { x: 0, z: 0 };
  }
  return {
    x: xPx / scalePxPerM,
    z: yPx / scalePxPerM,
  };
}
