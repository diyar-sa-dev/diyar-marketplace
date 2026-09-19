import { DomainErrorCode } from '../errors.ts';
import {
  aabbIntersects,
  areAllCornersInsideRoom,
  getItemAabb,
  getItemCornerPoints,
  roomAabb,
} from '../geometry/aabb.ts';
import type { RoomDesignDocument, RoomDesignItem } from '../models.ts';
import type { ConstraintResult, ConstraintViolation } from './types.ts';
import { emptyConstraintResult } from './types.ts';

export interface EvaluateConstraintsOptions {
  /** Item ids to skip for overlap checks (e.g. item being moved). */
  excludeOverlapForItemId?: string;
}

function roomBoundaryViolation(item: RoomDesignItem, roomAabbVal: ReturnType<typeof roomAabb>): ConstraintViolation | null {
  const corners = getItemCornerPoints(item);
  if (!areAllCornersInsideRoom(corners, roomAabbVal)) {
    return {
      code: DomainErrorCode.OUTSIDE_ROOM,
      severity: 'block',
      message: 'Item extends outside room bounds',
      itemIds: [item.id],
    };
  }
  return null;
}

function overlapWarnings(
  items: RoomDesignItem[],
  excludeId?: string,
): ConstraintViolation[] {
  const warnings: ConstraintViolation[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const a = items[i];
    if (a.id === excludeId) continue;
    const aabbA = getItemAabb(a);
    for (let j = i + 1; j < items.length; j += 1) {
      const b = items[j];
      if (b.id === excludeId) continue;
      const aabbB = getItemAabb(b);
      if (aabbIntersects(aabbA, aabbB)) {
        warnings.push({
          code: 'ITEM_OVERLAP',
          severity: 'warn',
          message: 'Items overlap',
          itemIds: [a.id, b.id],
        });
      }
    }
  }
  return warnings;
}

export function evaluateConstraints(
  document: RoomDesignDocument,
  options: EvaluateConstraintsOptions = {},
): ConstraintResult {
  const result = emptyConstraintResult();
  const roomBox = roomAabb(document.room.width_m, document.room.depth_m);

  for (const item of document.items) {
    const boundary = roomBoundaryViolation(item, roomBox);
    if (boundary) {
      result.valid = false;
      result.violations.push(boundary);
    }
  }

  result.warnings.push(...overlapWarnings(document.items, options.excludeOverlapForItemId));

  return result;
}

export function documentHasBlockingViolations(document: RoomDesignDocument): boolean {
  return !evaluateConstraints(document).valid;
}
