export const DomainErrorCode = {
  INVALID_ROOM_DIMENSIONS: 'INVALID_ROOM_DIMENSIONS',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
  INVALID_POSITION: 'INVALID_POSITION',
  INVALID_ROTATION: 'INVALID_ROTATION',
  INVALID_COMMAND: 'INVALID_COMMAND',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ITEM_LOCKED: 'ITEM_LOCKED',
  ITEM_LIMIT_REACHED: 'ITEM_LIMIT_REACHED',
  OUTSIDE_ROOM: 'OUTSIDE_ROOM',
  RESIZE_NOT_ALLOWED: 'RESIZE_NOT_ALLOWED',
  ROOM_SIZE_CAUSES_VIOLATIONS: 'ROOM_SIZE_CAUSES_VIOLATIONS',
  NON_FINITE_VALUE: 'NON_FINITE_VALUE',
  DUPLICATE_ITEM_ID: 'DUPLICATE_ITEM_ID',
  UNSUPPORTED_SCHEMA_VERSION: 'UNSUPPORTED_SCHEMA_VERSION',
  UNKNOWN_ROOM_PRESET: 'UNKNOWN_ROOM_PRESET',
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export function domainError(
  code: DomainErrorCode,
  message: string,
  details?: Record<string, unknown>,
): DomainError {
  return details ? { code, message, details } : { code, message };
}
