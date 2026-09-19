import type { RoomDesignItem } from '../models.ts';
import { rotationRadians } from './rotation.ts';

export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Point2 {
  x: number;
  z: number;
}

/** Footprint corners in world XZ (item center at position_m). */
export function getItemCornerPoints(item: RoomDesignItem): Point2[] {
  const { x, z } = item.position_m;
  const halfW = item.snapshot.width_m / 2;
  const halfD = item.snapshot.depth_m / 2;
  const local: Point2[] = [
    { x: -halfW, z: -halfD },
    { x: halfW, z: -halfD },
    { x: halfW, z: halfD },
    { x: -halfW, z: halfD },
  ];
  const rad = rotationRadians(item.rotation_deg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return local.map((p) => ({
    x: x + p.x * cos - p.z * sin,
    z: z + p.x * sin + p.z * cos,
  }));
}

export function getItemAabb(item: RoomDesignItem): Aabb {
  const corners = getItemCornerPoints(item);
  let minX = corners[0].x;
  let maxX = corners[0].x;
  let minZ = corners[0].z;
  let maxZ = corners[0].z;
  for (let i = 1; i < corners.length; i += 1) {
    const c = corners[i];
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minZ = Math.min(minZ, c.z);
    maxZ = Math.max(maxZ, c.z);
  }
  return { minX, maxX, minZ, maxZ };
}

export function roomAabb(width_m: number, depth_m: number): Aabb {
  return { minX: 0, maxX: width_m, minZ: 0, maxZ: depth_m };
}

export function aabbIntersects(a: Aabb, b: Aabb): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function isAabbInsideRoom(aabb: Aabb, room: Aabb): boolean {
  return (
    aabb.minX >= room.minX &&
    aabb.maxX <= room.maxX &&
    aabb.minZ >= room.minZ &&
    aabb.maxZ <= room.maxZ
  );
}

export function areAllCornersInsideRoom(corners: Point2[], room: Aabb): boolean {
  return corners.every(
    (p) => p.x >= room.minX && p.x <= room.maxX && p.z >= room.minZ && p.z <= room.maxZ,
  );
}
