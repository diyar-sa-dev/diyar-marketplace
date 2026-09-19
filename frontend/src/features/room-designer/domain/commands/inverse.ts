import type { RoomDesignDocument } from '../models.ts';
import { applyCommand } from './apply.ts';
import type { RoomCommand } from './types.ts';

function cloneItems(document: RoomDesignDocument) {
  return document.items.map((item) => ({
    ...item,
    position_m: { ...item.position_m },
    snapshot: { ...item.snapshot },
  }));
}

/** Build inverse command for history undo. */
export function buildInverseCommand(
  command: RoomCommand,
  before: RoomDesignDocument,
  after: RoomDesignDocument,
): RoomCommand | null {
  switch (command.type) {
    case 'ADD_ITEM':
      return { type: 'REMOVE_ITEM', itemId: command.item.id };
    case 'REMOVE_ITEM': {
      const removed = before.items.find((i) => i.id === command.itemId);
      if (!removed) return null;
      return {
        type: 'ADD_ITEM',
        item: {
          ...removed,
          position_m: { ...removed.position_m },
          snapshot: { ...removed.snapshot },
        },
      };
    }
    case 'MOVE': {
      const item = before.items.find((i) => i.id === command.itemId);
      if (!item) return null;
      return {
        type: 'MOVE',
        itemId: command.itemId,
        position_m: { ...item.position_m },
      };
    }
    case 'ROTATE': {
      const item = before.items.find((i) => i.id === command.itemId);
      if (!item) return null;
      return { type: 'ROTATE', itemId: command.itemId, rotation_deg: item.rotation_deg };
    }
    case 'RESIZE': {
      const item = before.items.find((i) => i.id === command.itemId);
      if (!item) return null;
      return {
        type: 'RESIZE',
        itemId: command.itemId,
        width_m: item.snapshot.width_m,
        depth_m: item.snapshot.depth_m,
      };
    }
    case 'DUPLICATE': {
      const beforeIds = new Set(before.items.map((i) => i.id));
      const added = after.items.find((i) => !beforeIds.has(i.id));
      if (!added) return null;
      return { type: 'REMOVE_ITEM', itemId: added.id };
    }
    case 'LOCK':
      return { type: 'UNLOCK', itemId: command.itemId };
    case 'UNLOCK':
      return { type: 'LOCK', itemId: command.itemId };
    case 'CLEAR_ROOM':
      return { type: 'RESTORE_ITEMS', items: cloneItems(before) };
    case 'SET_ROOM_SIZE':
      return {
        type: 'SET_ROOM_SIZE',
        width_m: before.room.width_m,
        depth_m: before.room.depth_m,
        height_m: before.room.height_m,
      };
    case 'APPLY_ROOM_PRESET': {
      if (before.room.preset_id) {
        return { type: 'APPLY_ROOM_PRESET', preset_id: before.room.preset_id };
      }
      return {
        type: 'SET_ROOM_SIZE',
        width_m: before.room.width_m,
        depth_m: before.room.depth_m,
        height_m: before.room.height_m,
      };
    }
    case 'SET_GRID':
      return {
        type: 'SET_GRID',
        enabled: before.room.grid?.enabled ?? false,
        step_m: before.room.grid?.step_m,
      };
    case 'RESTORE_ITEMS':
      return { type: 'CLEAR_ROOM' };
    case 'BATCH': {
      const inverses: RoomCommand[] = [];
      let rolling = before;
      for (const sub of command.commands) {
        const applied = applyCommand(rolling, sub);
        if (applied.ok === false) {
          return null;
        }
        const inv = buildInverseCommand(sub, rolling, applied.document);
        if (inv) {
          inverses.unshift(inv);
        }
        rolling = applied.document;
      }
      return { type: 'BATCH', commands: inverses };
    }
    default:
      return null;
  }
}
