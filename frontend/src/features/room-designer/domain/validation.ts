import {
  MAX_ITEM_EDGE_M,
  MAX_ROOM_EDGE_M,
  MAX_ROOM_HEIGHT_M,
  MIN_ITEM_EDGE_M,
  MIN_ROOM_EDGE_M,
  MIN_ROOM_HEIGHT_M,
} from './constants.ts';
import { DomainErrorCode, domainError, type DomainError } from './errors.ts';
import type { PositionM, Room, RoomDesignItem } from './models.ts';
import { isCatalogProductId } from './productId.ts';

export function assertFinite(value: number, label: string): DomainError | null {
  if (!Number.isFinite(value)) {
    return domainError(DomainErrorCode.NON_FINITE_VALUE, `${label} must be a finite number`, {
      label,
      value,
    });
  }
  return null;
}

export function validateRoomDimensions(
  width_m: number,
  depth_m: number,
  height_m?: number | null,
): DomainError | null {
  for (const [label, value] of [
    ['width_m', width_m],
    ['depth_m', depth_m],
  ] as const) {
    const finite = assertFinite(value, label);
    if (finite) return finite;
    if (value < MIN_ROOM_EDGE_M || value > MAX_ROOM_EDGE_M) {
      return domainError(
        DomainErrorCode.INVALID_ROOM_DIMENSIONS,
        `${label} must be between ${MIN_ROOM_EDGE_M} and ${MAX_ROOM_EDGE_M} meters`,
        { [label]: value },
      );
    }
  }

  if (height_m != null) {
    const finite = assertFinite(height_m, 'height_m');
    if (finite) return finite;
    if (height_m < MIN_ROOM_HEIGHT_M || height_m > MAX_ROOM_HEIGHT_M) {
      return domainError(
        DomainErrorCode.INVALID_ROOM_DIMENSIONS,
        `height_m must be between ${MIN_ROOM_HEIGHT_M} and ${MAX_ROOM_HEIGHT_M} meters`,
        { height_m },
      );
    }
  }

  return null;
}

export function validateItemSnapshotDimensions(width_m: number, depth_m: number): DomainError | null {
  for (const [label, value] of [
    ['width_m', width_m],
    ['depth_m', depth_m],
  ] as const) {
    const finite = assertFinite(value, label);
    if (finite) return finite;
    if (value < MIN_ITEM_EDGE_M || value > MAX_ITEM_EDGE_M) {
      return domainError(DomainErrorCode.INVALID_DIMENSIONS, `${label} is out of allowed item range`, {
        [label]: value,
      });
    }
  }
  return null;
}

export function validatePosition(position_m: PositionM): DomainError | null {
  const xErr = assertFinite(position_m.x, 'position_m.x');
  if (xErr) return xErr;
  const zErr = assertFinite(position_m.z, 'position_m.z');
  if (zErr) return zErr;
  return null;
}

export function validateRoom(room: Room): DomainError | null {
  return validateRoomDimensions(room.width_m, room.depth_m, room.height_m);
}

export function validateItemStructure(item: RoomDesignItem): DomainError | null {
  if (!item.id || typeof item.id !== 'string') {
    return domainError(DomainErrorCode.INVALID_COMMAND, 'Item id is required');
  }
  if (!isCatalogProductId(item.product_id)) {
    return domainError(DomainErrorCode.INVALID_COMMAND, 'product_id must be a catalog UUID');
  }
  const posErr = validatePosition(item.position_m);
  if (posErr) return posErr;
  const dimErr = validateItemSnapshotDimensions(item.snapshot.width_m, item.snapshot.depth_m);
  if (dimErr) return dimErr;
  if (item.snapshot.height_m != null) {
    const hErr = assertFinite(item.snapshot.height_m, 'height_m');
    if (hErr) return hErr;
  }
  return null;
}
