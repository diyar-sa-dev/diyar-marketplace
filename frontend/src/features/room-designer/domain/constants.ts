/** Spatial limits — align with Stage 30 master + backend validator draft. */

export const SCHEMA_VERSION = 1 as const;

export const MAX_ITEMS = 100;
export const MAX_HISTORY = 50;

export const MIN_ROOM_EDGE_M = 1.5;
export const MAX_ROOM_EDGE_M = 30;
export const MIN_ROOM_HEIGHT_M = 2;
export const MAX_ROOM_HEIGHT_M = 6;

export const MIN_ITEM_EDGE_M = 0.01;
export const MAX_ITEM_EDGE_M = 10;

export const DEFAULT_GRID_STEP_M = 0.1;

/** Meters — acceptable float precision for commerce dimensions. */
export const METER_EPSILON = 1e-6;
