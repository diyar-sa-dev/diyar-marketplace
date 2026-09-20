import type { RoomDesignItem, Room } from '../../domain/models.ts';
import { normalizeRotationDeg } from '../../domain/geometry/rotation.ts';

/**
 * DIYAR domain: X/Z floor plane (meters), Y reserved for up.
 * Three.js: floor on XZ, Y is elevation.
 */
export interface ThreeVec3 {
  x: number;
  y: number;
  z: number;
}

export function itemCenterToThreeMeters(item: RoomDesignItem): ThreeVec3 {
  const height_m = item.snapshot.height_m ?? 0.75;
  return {
    x: item.position_m.x,
    y: height_m / 2,
    z: item.position_m.z,
  };
}

export function itemSizeToThreeMeters(item: RoomDesignItem): ThreeVec3 {
  const height_m = item.snapshot.height_m ?? 0.75;
  return {
    x: item.snapshot.width_m,
    y: height_m,
    z: item.snapshot.depth_m,
  };
}

export function itemRotationYRadians(item: RoomDesignItem): number {
  return (normalizeRotationDeg(item.rotation_deg) * Math.PI) / 180;
}

export function roomCenterMeters(room: Room): ThreeVec3 {
  const h = room.height_m ?? 2.7;
  return {
    x: room.width_m / 2,
    y: h / 2,
    z: room.depth_m / 2,
  };
}

/** Normalize GLB root so 1 unit = 1 meter when catalog dimensions provided. */
export function scaleVectorToFitCatalog(
  measured: ThreeVec3,
  catalog: ThreeVec3,
): ThreeVec3 {
  const sx = measured.x > 0 ? catalog.x / measured.x : 1;
  const sy = measured.y > 0 ? catalog.y / measured.y : 1;
  const sz = measured.z > 0 ? catalog.z / measured.z : 1;
  return {
    x: Number.isFinite(sx) ? sx : 1,
    y: Number.isFinite(sy) ? sy : 1,
    z: Number.isFinite(sz) ? sz : 1,
  };
}
