import { MAX_ITEMS, SCHEMA_VERSION } from './constants.ts';
import { DomainErrorCode, domainError, type DomainError } from './errors.ts';
import type { RoomDesignDocument } from './models.ts';
import { validateItemStructure, validateRoom } from './validation.ts';

export function serializeDocument(document: RoomDesignDocument): string {
  return JSON.stringify(document);
}

export function parseDocument(json: string): { ok: true; document: RoomDesignDocument } | { ok: false; error: DomainError } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: domainError(DomainErrorCode.INVALID_COMMAND, 'Invalid JSON') };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: domainError(DomainErrorCode.INVALID_COMMAND, 'Document must be an object') };
  }

  const doc = parsed as RoomDesignDocument;
  if (doc.schema_version !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: domainError(
        DomainErrorCode.UNSUPPORTED_SCHEMA_VERSION,
        `Unsupported schema_version: ${String(doc.schema_version)}`,
      ),
    };
  }

  const roomErr = validateRoom(doc.room);
  if (roomErr) return { ok: false, error: roomErr };

  if (!Array.isArray(doc.items)) {
    return { ok: false, error: domainError(DomainErrorCode.INVALID_COMMAND, 'items must be an array') };
  }

  if (doc.items.length > MAX_ITEMS) {
    return {
      ok: false,
      error: domainError(DomainErrorCode.ITEM_LIMIT_REACHED, 'Too many items in document'),
    };
  }

  for (const item of doc.items) {
    const itemErr = validateItemStructure(item);
    if (itemErr) {
      return { ok: false, error: itemErr };
    }
  }

  return { ok: true, document: doc };
}
