import { applyCommand } from '../domain/commands/apply.ts';
import { buildInverseCommand } from '../domain/commands/inverse.ts';
import type { RoomCommand } from '../domain/commands/types.ts';
import { evaluateConstraints } from '../domain/constraints/engine.ts';
import type { ConstraintViolation } from '../domain/constraints/types.ts';
import { DomainErrorCode, domainError, type DomainError } from '../domain/errors.ts';
import type { RoomDesignDocument } from '../domain/models.ts';
import { validatePosition } from '../domain/validation.ts';

const MUTATIONS_REQUIRING_UNLOCK = new Set<RoomCommand['type']>([
  'REMOVE_ITEM',
  'MOVE',
  'ROTATE',
  'RESIZE',
  'DUPLICATE',
]);

function itemIdFromCommand(command: RoomCommand): string | null {
  switch (command.type) {
    case 'REMOVE_ITEM':
    case 'MOVE':
    case 'ROTATE':
    case 'RESIZE':
    case 'DUPLICATE':
    case 'LOCK':
    case 'UNLOCK':
      return command.itemId;
    default:
      return null;
  }
}

function assertUnlocked(document: RoomDesignDocument, command: RoomCommand): DomainError | null {
  const itemId = itemIdFromCommand(command);
  if (!itemId || !MUTATIONS_REQUIRING_UNLOCK.has(command.type)) {
    return null;
  }
  const item = document.items.find((i) => i.id === itemId);
  if (item?.locked) {
    return domainError(DomainErrorCode.ITEM_LOCKED, 'Item is locked', { itemId });
  }
  return null;
}

export interface DispatchSuccess {
  ok: true;
  document: RoomDesignDocument;
  warnings: ConstraintViolation[];
  inverse: RoomCommand | null;
}

export type DispatchResult = DispatchSuccess | { ok: false; error: DomainError };

export function dispatchCommand(
  document: RoomDesignDocument,
  command: RoomCommand,
): DispatchResult {
  const lockErr = assertUnlocked(document, command);
  if (lockErr) return { ok: false, error: lockErr };

  if (command.type === 'MOVE') {
    const posErr = validatePosition(command.position_m);
    if (posErr) return { ok: false, error: posErr };
  }

  const before = document;
  const applied = applyCommand(document, command);
  if (applied.ok === false) {
    return { ok: false, error: applied.error };
  }

  const constraints = evaluateConstraints(applied.document, {
    excludeOverlapForItemId: command.type === 'MOVE' ? command.itemId : undefined,
  });

  if (!constraints.valid) {
    const primary = constraints.violations[0];
    if (command.type === 'SET_ROOM_SIZE' || command.type === 'APPLY_ROOM_PRESET') {
      return {
        ok: false,
        error: domainError(
          DomainErrorCode.ROOM_SIZE_CAUSES_VIOLATIONS,
          'Room resize would place items outside bounds',
          { violations: constraints.violations },
        ),
      };
    }
    return {
      ok: false,
      error: domainError(
        primary?.code === DomainErrorCode.OUTSIDE_ROOM
          ? DomainErrorCode.OUTSIDE_ROOM
          : DomainErrorCode.INVALID_POSITION,
        primary?.message ?? 'Constraint violation',
        { violations: constraints.violations },
      ),
    };
  }

  const inverse = buildInverseCommand(command, before, applied.document);

  return {
    ok: true,
    document: applied.document,
    warnings: constraints.warnings,
    inverse,
  };
}
