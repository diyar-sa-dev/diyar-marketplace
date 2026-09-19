import { DEFAULT_GRID_STEP_M, MAX_ITEMS } from '../constants.ts';
import { DomainErrorCode, domainError, type DomainError } from '../errors.ts';
import { normalizeRotationDeg } from '../geometry/rotation.ts';
import type { RoomDesignDocument, RoomDesignItem } from '../models.ts';
import { getRoomPreset } from '../room/presets.ts';
import { validateItemStructure, validateRoomDimensions } from '../validation.ts';
import type { RoomCommand } from './types.ts';

function cloneDocument(document: RoomDesignDocument): RoomDesignDocument {
  return {
    schema_version: document.schema_version,
    room: { ...document.room, grid: document.room.grid ? { ...document.room.grid } : undefined },
    items: document.items.map((item) => ({
      ...item,
      position_m: { ...item.position_m },
      snapshot: { ...item.snapshot },
    })),
  };
}

function findItemIndex(document: RoomDesignDocument, itemId: string): number {
  return document.items.findIndex((i) => i.id === itemId);
}

function findItem(document: RoomDesignDocument, itemId: string): RoomDesignItem | undefined {
  return document.items.find((i) => i.id === itemId);
}

export type ApplyResult =
  | { ok: true; document: RoomDesignDocument }
  | { ok: false; error: DomainError };

/** Pure state transition — no constraints or lock checks. */
export function applyCommand(document: RoomDesignDocument, command: RoomCommand): ApplyResult {
  const next = cloneDocument(document);

  switch (command.type) {
    case 'ADD_ITEM': {
      const structErr = validateItemStructure(command.item);
      if (structErr) return { ok: false, error: structErr };
      if (next.items.length >= MAX_ITEMS) {
        return {
          ok: false,
          error: domainError(DomainErrorCode.ITEM_LIMIT_REACHED, 'Maximum item count reached'),
        };
      }
      if (next.items.some((i) => i.id === command.item.id)) {
        return {
          ok: false,
          error: domainError(DomainErrorCode.DUPLICATE_ITEM_ID, 'Item id already exists'),
        };
      }
      const item: RoomDesignItem = {
        ...command.item,
        rotation_deg: normalizeRotationDeg(command.item.rotation_deg),
        position_m: { ...command.item.position_m },
        snapshot: { ...command.item.snapshot },
      };
      next.items.push(item);
      return { ok: true, document: next };
    }
    case 'REMOVE_ITEM': {
      const idx = findItemIndex(next, command.itemId);
      if (idx === -1) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      next.items.splice(idx, 1);
      return { ok: true, document: next };
    }
    case 'MOVE': {
      const item = findItem(next, command.itemId);
      if (!item) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      item.position_m = { ...command.position_m };
      return { ok: true, document: next };
    }
    case 'ROTATE': {
      const item = findItem(next, command.itemId);
      if (!item) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      if (!Number.isFinite(command.rotation_deg)) {
        return {
          ok: false,
          error: domainError(DomainErrorCode.INVALID_ROTATION, 'Rotation must be finite'),
        };
      }
      item.rotation_deg = normalizeRotationDeg(command.rotation_deg);
      return { ok: true, document: next };
    }
    case 'RESIZE': {
      const item = findItem(next, command.itemId);
      if (!item) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      const resizable = item.snapshot.resizable === true;
      if (!resizable) {
        return {
          ok: false,
          error: domainError(
            DomainErrorCode.RESIZE_NOT_ALLOWED,
            'Catalog items cannot be resized in V1',
          ),
        };
      }
      item.snapshot = {
        ...item.snapshot,
        width_m: command.width_m,
        depth_m: command.depth_m,
      };
      return { ok: true, document: next };
    }
    case 'DUPLICATE': {
      const source = findItem(next, command.itemId);
      if (!source) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      if (next.items.length >= MAX_ITEMS) {
        return {
          ok: false,
          error: domainError(DomainErrorCode.ITEM_LIMIT_REACHED, 'Maximum item count reached'),
        };
      }
      const offset = command.offset_m ?? { x: 0.2, z: 0.2 };
      const newId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${source.id}-copy-${next.items.length + 1}`;
      const duplicate: RoomDesignItem = {
        ...source,
        id: newId,
        locked: false,
        position_m: {
          x: source.position_m.x + offset.x,
          z: source.position_m.z + offset.z,
        },
        snapshot: { ...source.snapshot },
      };
      next.items.push(duplicate);
      return { ok: true, document: next };
    }
    case 'LOCK': {
      const item = findItem(next, command.itemId);
      if (!item) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      item.locked = true;
      return { ok: true, document: next };
    }
    case 'UNLOCK': {
      const item = findItem(next, command.itemId);
      if (!item) {
        return { ok: false, error: domainError(DomainErrorCode.ITEM_NOT_FOUND, 'Item not found') };
      }
      item.locked = false;
      return { ok: true, document: next };
    }
    case 'CLEAR_ROOM': {
      next.items = [];
      return { ok: true, document: next };
    }
    case 'SET_ROOM_SIZE': {
      const roomErr = validateRoomDimensions(
        command.width_m,
        command.depth_m,
        command.height_m,
      );
      if (roomErr) return { ok: false, error: roomErr };
      next.room = {
        ...next.room,
        preset_id: null,
        width_m: command.width_m,
        depth_m: command.depth_m,
        height_m: command.height_m ?? next.room.height_m ?? null,
      };
      return { ok: true, document: next };
    }
    case 'APPLY_ROOM_PRESET': {
      const preset = getRoomPreset(command.preset_id);
      if (!preset) {
        return {
          ok: false,
          error: domainError(DomainErrorCode.UNKNOWN_ROOM_PRESET, 'Unknown room preset', {
            preset_id: command.preset_id,
          }),
        };
      }
      next.room = {
        ...next.room,
        preset_id: preset.id,
        width_m: preset.width_m,
        depth_m: preset.depth_m,
        height_m: preset.height_m,
      };
      return { ok: true, document: next };
    }
    case 'SET_GRID': {
      const step = command.step_m ?? DEFAULT_GRID_STEP_M;
      next.room = {
        ...next.room,
        grid: { enabled: command.enabled, step_m: step },
      };
      return { ok: true, document: next };
    }
    case 'RESTORE_ITEMS': {
      next.items = command.items.map((item) => ({
        ...item,
        position_m: { ...item.position_m },
        snapshot: { ...item.snapshot },
      }));
      return { ok: true, document: next };
    }
    case 'BATCH': {
      let doc = next;
      for (const sub of command.commands) {
        if (sub.type === 'BATCH') {
          return {
            ok: false,
            error: domainError(DomainErrorCode.INVALID_COMMAND, 'Nested BATCH is not allowed'),
          };
        }
        const step = applyCommand(doc, sub);
        if (step.ok === false) {
          return step;
        }
        doc = step.document;
      }
      return { ok: true, document: doc };
    }
    default: {
      const exhaustive: never = command;
      return {
        ok: false,
        error: domainError(DomainErrorCode.INVALID_COMMAND, `Unknown command: ${(exhaustive as RoomCommand).type}`),
      };
    }
  }
}
