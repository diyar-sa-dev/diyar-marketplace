/** Stage 30.14 — client sub-flag (build-time). Enabled by default unless explicitly disabled. */
export function isRoomDesigner25dEnabled(): boolean {
  return import.meta.env.VITE_ROOM_DESIGNER_25D_ENABLED !== 'false';
}

/** Stage 30.15 — client sub-flag. Enabled by default unless explicitly disabled. */
export function isRoomDesigner3dEnabled(): boolean {
  return import.meta.env.VITE_ROOM_DESIGNER_3D_ENABLED !== 'false';
}

/** Stage 30.16 — layout suggestions via command pipeline. */
export function isRoomDesignerAiSpatialEnabled(): boolean {
  return import.meta.env.VITE_ROOM_DESIGNER_AI_SPATIAL_ENABLED !== 'false';
}

/** Stage 30.17 — AR preview module (lazy); no AR deps in default bundle. */
export function isRoomDesignerArEnabled(): boolean {
  return import.meta.env.VITE_ROOM_DESIGNER_AR_ENABLED === 'true';
}

export function hasPresentationModeToggle(): boolean {
  return isRoomDesigner25dEnabled() || isRoomDesigner3dEnabled();
}
