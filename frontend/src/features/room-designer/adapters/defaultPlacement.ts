import type { PositionM, Room } from '../domain/models.ts';

const PLACEMENT_STEP_M = 0.15;

/** Deterministic placement — room center with small grid offset by existing item count (UX spec). */
export function defaultAddPosition(room: Room, existingItemCount: number): PositionM {
  const cx = room.width_m / 2;
  const cz = room.depth_m / 2;
  const col = existingItemCount % 5;

  return {
    x: cx + col * PLACEMENT_STEP_M,
    z: cz + Math.floor(existingItemCount / 5) * PLACEMENT_STEP_M,
  };
}
