const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 8 * 1024 * 1024;

export type TryInRoomFileErrorKey = 'invalid_type' | 'file_too_large';

export function validateTryInRoomFile(file: File): TryInRoomFileErrorKey | null {
  if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
    return 'invalid_type';
  }
  if (file.size > MAX_BYTES) {
    return 'file_too_large';
  }
  return null;
}
