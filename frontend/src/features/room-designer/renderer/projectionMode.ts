import {
  itemFootprintIsometricPx,
  metersToIsometricCanvasPoint,
  isometricCanvasPointToMeters,
  type CanvasPointPx,
} from './isometric25d.ts';

export type RoomProjectionMode = 'top_down' | 'isometric_25d' | 'room_3d';

export const DEFAULT_PROJECTION_MODE: RoomProjectionMode = 'top_down';

export function usesFabricRenderer(mode: RoomProjectionMode): boolean {
  return mode === 'top_down' || mode === 'isometric_25d';
}

export function usesThreeRenderer(mode: RoomProjectionMode): boolean {
  return mode === 'room_3d';
}

export function rendererBackendKey(mode: RoomProjectionMode): 'fabric' | 'three' {
  return usesThreeRenderer(mode) ? 'three' : 'fabric';
}

export function nextPresentationMode(
  current: RoomProjectionMode,
  opts: { allow25d: boolean; allow3d: boolean },
): RoomProjectionMode {
  const modes: RoomProjectionMode[] = ['top_down'];
  if (opts.allow25d) {
    modes.push('isometric_25d');
  }
  if (opts.allow3d) {
    modes.push('room_3d');
  }
  if (modes.length === 1) {
    return 'top_down';
  }
  const index = modes.indexOf(current);
  const next = index < 0 ? 0 : (index + 1) % modes.length;
  return modes[next] ?? 'top_down';
}

export function metersToCanvasPoint(
  mode: RoomProjectionMode,
  x_m: number,
  z_m: number,
  scalePxPerM: number,
): CanvasPointPx {
  if (mode === 'isometric_25d') {
    return metersToIsometricCanvasPoint(x_m, z_m, scalePxPerM);
  }
  return {
    x: x_m * scalePxPerM,
    y: z_m * scalePxPerM,
  };
}

export function canvasPointToMeters(
  mode: RoomProjectionMode,
  xPx: number,
  yPx: number,
  scalePxPerM: number,
): { x: number; z: number } {
  if (mode === 'isometric_25d') {
    return isometricCanvasPointToMeters(xPx, yPx, scalePxPerM);
  }
  if (
    !Number.isFinite(xPx) ||
    !Number.isFinite(yPx) ||
    !Number.isFinite(scalePxPerM) ||
    scalePxPerM === 0
  ) {
    return { x: 0, z: 0 };
  }
  return {
    x: xPx / scalePxPerM,
    z: yPx / scalePxPerM,
  };
}

export function itemFootprintTopLeftPx(
  mode: RoomProjectionMode,
  position_m: { x: number; z: number },
  width_m: number,
  depth_m: number,
  scalePxPerM: number,
): { left: number; top: number; widthPx: number; heightPx: number } {
  const center = metersToCanvasPoint(mode, position_m.x, position_m.z, scalePxPerM);
  if (mode === 'isometric_25d') {
    const { widthPx, heightPx } = itemFootprintIsometricPx(width_m, depth_m, scalePxPerM);
    return {
      left: center.x,
      top: center.y,
      widthPx,
      heightPx,
    };
  }
  const widthPx = width_m * scalePxPerM;
  const heightPx = depth_m * scalePxPerM;
  return {
    left: center.x - widthPx / 2,
    top: center.y - heightPx / 2,
    widthPx,
    heightPx,
  };
}
