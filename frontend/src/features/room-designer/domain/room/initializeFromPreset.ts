import { DomainErrorCode, domainError, type DomainError } from '../errors.ts';
import { createEmptyDocument, type RoomDesignDocument } from '../models.ts';
import { getRoomPreset } from './presets.ts';

export function createDocumentFromPreset(
  presetId: string,
): { ok: true; document: RoomDesignDocument } | { ok: false; error: DomainError } {
  const preset = getRoomPreset(presetId);
  if (!preset) {
    return {
      ok: false,
      error: domainError(DomainErrorCode.UNKNOWN_ROOM_PRESET, `Unknown room preset: ${presetId}`, {
        presetId,
      }),
    };
  }

  const document = createEmptyDocument(preset.width_m, preset.depth_m, preset.height_m);
  document.room.preset_id = preset.id;
  return { ok: true, document };
}
