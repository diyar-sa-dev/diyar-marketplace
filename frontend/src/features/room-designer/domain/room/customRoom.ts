import type { DomainError } from '../errors.ts';
import { createEmptyDocument, type RoomDesignDocument } from '../models.ts';
import { validateRoomDimensions } from '../validation.ts';

/** Validate user-provided custom rectangular room (meters). */
export function validateCustomRoom(
  width_m: number,
  depth_m: number,
  height_m?: number | null,
): DomainError | null {
  return validateRoomDimensions(width_m, depth_m, height_m);
}

export function createCustomRoomDocument(
  width_m: number,
  depth_m: number,
  height_m?: number | null,
): { ok: true; document: RoomDesignDocument } | { ok: false; error: DomainError } {
  const error = validateCustomRoom(width_m, depth_m, height_m);
  if (error) {
    return { ok: false, error };
  }
  return {
    ok: true,
    document: createEmptyDocument(width_m, depth_m, height_m),
  };
}
