import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../models.ts';
import { makeItem } from '../testFixtures.ts';
import { evaluateConstraints } from './engine.ts';

describe('evaluateConstraints', () => {
  it('accepts item fully inside room', () => {
    const doc = createEmptyDocument(5, 5);
    doc.items = [makeItem({ position_m: { x: 2.5, z: 2.5 } })];
    const result = evaluateConstraints(doc);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('blocks item outside room', () => {
    const doc = createEmptyDocument(5, 5);
    doc.items = [makeItem({ position_m: { x: 0.5, z: 0.5 } })];
    const result = evaluateConstraints(doc);
    expect(result.valid).toBe(false);
    expect(result.violations[0]?.code).toBe('OUTSIDE_ROOM');
  });

  it('warns on overlap without blocking', () => {
    const doc = createEmptyDocument(6, 6);
    doc.items = [
      makeItem({ id: 'a', position_m: { x: 2, z: 2 } }),
      makeItem({ id: 'b', position_m: { x: 2.5, z: 2.5 } }),
    ];
    const result = evaluateConstraints(doc);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === 'ITEM_OVERLAP')).toBe(true);
  });
});
