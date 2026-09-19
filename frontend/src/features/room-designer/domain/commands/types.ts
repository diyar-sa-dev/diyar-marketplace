import type { PositionM, RoomDesignItem } from '../models.ts';

export type RoomCommand =
  | { type: 'ADD_ITEM'; item: RoomDesignItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'MOVE'; itemId: string; position_m: PositionM }
  | { type: 'ROTATE'; itemId: string; rotation_deg: number }
  | { type: 'RESIZE'; itemId: string; width_m: number; depth_m: number }
  | { type: 'DUPLICATE'; itemId: string; offset_m?: PositionM }
  | { type: 'LOCK'; itemId: string }
  | { type: 'UNLOCK'; itemId: string }
  | { type: 'CLEAR_ROOM' }
  | {
      type: 'SET_ROOM_SIZE';
      width_m: number;
      depth_m: number;
      height_m?: number | null;
    }
  | { type: 'APPLY_ROOM_PRESET'; preset_id: string }
  | { type: 'SET_GRID'; enabled: boolean; step_m?: number }
  /** Internal: restore items after CLEAR_ROOM undo. */
  | { type: 'RESTORE_ITEMS'; items: RoomDesignItem[] }
  /** Atomic multi-command (single undo step). */
  | { type: 'BATCH'; commands: RoomCommand[] };

export interface AppliedCommandRecord {
  command: RoomCommand;
  inverse: RoomCommand;
}
