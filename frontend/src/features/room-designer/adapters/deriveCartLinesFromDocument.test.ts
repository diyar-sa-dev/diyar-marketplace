import { describe, expect, it } from 'vitest';
import { makeItem } from '../domain/testFixtures.ts';
import { createEmptyDocument } from '../domain/models.ts';
import { deriveCartLinesFromDocument } from './deriveCartLinesFromDocument.ts';

describe('deriveCartLinesFromDocument', () => {
  it('aggregates duplicate product instances', () => {
    const pid = '550e8400-e29b-41d4-a716-446655440099';
    const doc = createEmptyDocument(4, 4);
    doc.items = [
      makeItem({ id: 'a', product_id: pid }),
      makeItem({ id: 'b', product_id: pid }),
      makeItem({ id: 'c', product_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    ];

    const lines = deriveCartLinesFromDocument(doc);
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.product_id === pid)?.quantity).toBe(2);
  });

  it('filters by room item ids', () => {
    const doc = createEmptyDocument(3, 3);
    const keep = makeItem({ id: 'keep-me' });
    doc.items = [keep, makeItem({ id: 'drop-me' })];

    const lines = deriveCartLinesFromDocument(doc, ['keep-me']);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(1);
  });
});
