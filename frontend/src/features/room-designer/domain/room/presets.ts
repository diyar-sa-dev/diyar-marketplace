/**
 * Canonical room presets (meters). IDs align with sidebar mock backgrounds for future UI wiring.
 * Presentation names are metadata only — spatial engine uses dimensions + preset_id.
 */
export interface RoomPreset {
  id: string;
  name_ar: string;
  name_en: string;
  width_m: number;
  depth_m: number;
  height_m: number;
  /** Decorative / analytics metadata — not used by constraints. */
  style?: string;
}

export const ROOM_PRESETS: readonly RoomPreset[] = [
  {
    id: 'majlis',
    name_ar: 'المجلس التراثي الأصيل',
    name_en: 'Traditional majlis',
    width_m: 5.5,
    depth_m: 6,
    height_m: 3,
    style: 'heritage',
  },
  {
    id: 'salon',
    name_ar: 'صالون مودرن دافئ',
    name_en: 'Modern living salon',
    width_m: 4.5,
    depth_m: 5,
    height_m: 2.8,
    style: 'modern',
  },
  {
    id: 'bedroom',
    name_ar: 'جناح النوم الفاخر',
    name_en: 'Master bedroom suite',
    width_m: 4,
    depth_m: 4.5,
    height_m: 2.7,
    style: 'bedroom',
  },
] as const;

const presetById = new Map(ROOM_PRESETS.map((preset) => [preset.id, preset]));

export function listRoomPresets(): readonly RoomPreset[] {
  return ROOM_PRESETS;
}

export function getRoomPreset(presetId: string): RoomPreset | undefined {
  return presetById.get(presetId);
}

export function isKnownRoomPreset(presetId: string): boolean {
  return presetById.has(presetId);
}
