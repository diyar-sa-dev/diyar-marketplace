import type { RoomCommand } from '../domain/commands/types.ts';
import { normalizeRotationDeg } from '../domain/geometry/rotation.ts';
import type { RoomDesignItem } from '../domain/models.ts';
import { roundMeters } from '../domain/units.ts';
import { canvasPointToMeters, DEFAULT_PROJECTION_MODE, type RoomProjectionMode } from '../renderer/projectionMode.ts';

const POSITION_EPS_M = 0.001;
const ROTATION_EPS_DEG = 0.05;

/** Convert Fabric center position + angle to domain commands (no side effects). */
export function fabricModifyToCommands(
  item: RoomDesignItem,
  centerPx: { x: number; y: number },
  angleDeg: number,
  scalePxPerM: number,
  projection: RoomProjectionMode = DEFAULT_PROJECTION_MODE,
): RoomCommand[] {
  const meters = canvasPointToMeters(projection, centerPx.x, centerPx.y, scalePxPerM);
  const position_m = {
    x: roundMeters(meters.x),
    z: roundMeters(meters.z),
  };
  const rotation_deg = normalizeRotationDeg(angleDeg);

  const commands: RoomCommand[] = [];
  const moved =
    Math.abs(position_m.x - item.position_m.x) > POSITION_EPS_M ||
    Math.abs(position_m.z - item.position_m.z) > POSITION_EPS_M;
  const rotated = Math.abs(rotation_deg - item.rotation_deg) > ROTATION_EPS_DEG;

  if (moved) {
    commands.push({ type: 'MOVE', itemId: item.id, position_m });
  }
  if (rotated) {
    commands.push({ type: 'ROTATE', itemId: item.id, rotation_deg });
  }
  return commands;
}
