import { SCHEMA_VERSION } from './constants.ts';

/** World X/Z position of item center (Y reserved for 3D). RTL-neutral. */
export interface PositionM {
  x: number;
  z: number;
}

export interface ItemSnapshot {
  name: string;
  width_m: number;
  depth_m: number;
  height_m?: number | null;
  thumbnail_url?: string | null;
  asset_ref?: string | null;
  /** When true, RESIZE may change width_m/depth_m on snapshot (not used in V1 catalog). */
  resizable?: boolean;
}

export interface RoomDesignItem {
  id: string;
  /** Marketplace catalog UUID — stable in saved documents. */
  product_id: string;
  variant_key?: string | null;
  position_m: PositionM;
  rotation_deg: number;
  locked: boolean;
  layer: number;
  snapshot: ItemSnapshot;
}

export interface RoomGrid {
  enabled: boolean;
  step_m: number;
}

export interface Room {
  preset_id?: string | null;
  width_m: number;
  depth_m: number;
  height_m?: number | null;
  origin?: 'corner' | 'center';
  grid?: RoomGrid;
}

export interface RoomDesignDocument {
  schema_version: typeof SCHEMA_VERSION;
  room: Room;
  items: RoomDesignItem[];
}

export function createEmptyDocument(
  width_m: number,
  depth_m: number,
  height_m?: number | null,
): RoomDesignDocument {
  return {
    schema_version: SCHEMA_VERSION,
    room: {
      width_m,
      depth_m,
      height_m: height_m ?? null,
      origin: 'corner',
    },
    items: [],
  };
}
