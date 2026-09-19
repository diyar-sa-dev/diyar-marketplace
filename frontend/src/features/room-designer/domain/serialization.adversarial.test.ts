import { describe, expect, it } from 'vitest';
import { MAX_ITEMS } from './constants.ts';
import { DomainErrorCode } from './errors.ts';
import { createEmptyDocument } from './models.ts';
import { parseDocument, serializeDocument } from './serialization.ts';
import { makeItem } from './testFixtures.ts';

describe('parseDocument adversarial', () => {
  it('rejects invalid JSON', () => {
    const result = parseDocument('{');
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.code).toBe(DomainErrorCode.INVALID_COMMAND);
    }
  });

  it('rejects unsupported schema version', () => {
    const result = parseDocument(JSON.stringify({ schema_version: 99, room: {}, items: [] }));
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.code).toBe(DomainErrorCode.UNSUPPORTED_SCHEMA_VERSION);
    }
  });

  it('rejects zero room dimensions', () => {
    const doc = createEmptyDocument(5, 5);
    doc.room.width_m = 0;
    const result = parseDocument(serializeDocument(doc));
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.code).toBe(DomainErrorCode.INVALID_ROOM_DIMENSIONS);
    }
  });

  it('rejects negative room dimensions', () => {
    const doc = createEmptyDocument(5, 5);
    doc.room.depth_m = -1;
    const result = parseDocument(serializeDocument(doc));
    expect(result.ok).toBe(false);
  });

  it('rejects non-array items', () => {
    const result = parseDocument(
      JSON.stringify({
        schema_version: 1,
        room: { width_m: 5, depth_m: 5 },
        items: {},
      }),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects malformed item entries', () => {
    const doc = createEmptyDocument(5, 5);
    doc.items = [{ id: '', product_id: -1 } as never];
    const result = parseDocument(serializeDocument(doc));
    expect(result.ok).toBe(false);
  });

  it('rejects documents exceeding max item count', () => {
    const doc = createEmptyDocument(20, 20);
    for (let i = 0; i < MAX_ITEMS + 1; i += 1) {
      doc.items.push(makeItem({ id: `i-${i}`, position_m: { x: 10, z: 10 } }));
    }
    const result = parseDocument(serializeDocument(doc));
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.code).toBe(DomainErrorCode.ITEM_LIMIT_REACHED);
    }
  });
});
