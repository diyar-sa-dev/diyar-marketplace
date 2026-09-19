import { describe, expect, it } from 'vitest';
import { parseDocument, serializeDocument } from './serialization.ts';
import { makeItem } from './testFixtures.ts';
import { createEmptyDocument } from './models.ts';
import { isCatalogProductId } from './productId.ts';

describe('serialization UUID product_id', () => {
  it('round-trips catalog UUID in saved document JSON', () => {
    const doc = createEmptyDocument(4, 4);
    doc.items = [makeItem()];
    const parsed = parseDocument(serializeDocument(doc));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(isCatalogProductId(parsed.document.items[0]?.product_id)).toBe(true);
  });

  it('rejects legacy integer product_id in JSON', () => {
    const doc = createEmptyDocument(3, 3);
    doc.items = [makeItem({ product_id: 99 as never })];
    const parsed = parseDocument(serializeDocument(doc));
    expect(parsed.ok).toBe(false);
  });
});
