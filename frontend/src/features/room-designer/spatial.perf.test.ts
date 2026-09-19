import { describe, expect, it } from 'vitest';
import { dispatchCommand } from './application/commandDispatcher.ts';
import { evaluateConstraints } from './domain/constraints/engine.ts';
import { createEmptyDocument } from './domain/models.ts';
import { serializeDocument } from './domain/serialization.ts';
import { makeItem } from './domain/testFixtures.ts';
import { createSpatialEngine, executeCommand, redo, undo } from './application/spatialEngine.ts';

type Op = 'MOVE' | 'ROTATE' | 'COLLISION' | 'UNDO' | 'REDO' | 'SERIALIZE';

function buildDocument(itemCount: number) {
  const doc = createEmptyDocument(20, 20);
  for (let i = 0; i < itemCount; i += 1) {
    doc.items.push(
      makeItem({
        id: `item-${i}`,
        position_m: { x: 2 + (i % 8) * 1.5, z: 2 + Math.floor(i / 8) * 1.5 },
      }),
    );
  }
  return doc;
}

function measureMs(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    fn();
  }
  return (performance.now() - start) / iterations;
}

function benchTable(counts: number[], iterations: number): Record<Op, Record<number, number>> {
  const table: Record<Op, Record<number, number>> = {
    MOVE: {},
    ROTATE: {},
    COLLISION: {},
    UNDO: {},
    REDO: {},
    SERIALIZE: {},
  };

  for (const count of counts) {
    const doc = buildDocument(count);
    table.MOVE[count] = measureMs(() => {
      dispatchCommand(doc, {
        type: 'MOVE',
        itemId: 'item-0',
        position_m: { x: 3.1, z: 3.1 },
      });
    }, iterations);

    table.ROTATE[count] = measureMs(() => {
      dispatchCommand(doc, {
        type: 'ROTATE',
        itemId: 'item-0',
        rotation_deg: 45,
      });
    }, iterations);

    table.COLLISION[count] = measureMs(() => {
      evaluateConstraints(doc);
    }, iterations);

    table.SERIALIZE[count] = measureMs(() => {
      serializeDocument(doc);
    }, iterations);

    let engine = createSpatialEngine(20, 20);
    for (const item of doc.items) {
      const add = executeCommand(engine, { type: 'ADD_ITEM', item });
      if (add.ok) engine = add.state;
    }
    const moved = executeCommand(engine, {
      type: 'MOVE',
      itemId: 'item-0',
      position_m: { x: 3, z: 3 },
    });
    if (moved.ok) engine = moved.state;

    table.UNDO[count] = measureMs(() => {
      const u = undo(engine);
      if (u.ok) undo(u.state);
    }, Math.max(10, Math.floor(iterations / 5)));

    table.REDO[count] = measureMs(() => {
      const u = undo(engine);
      if (u.ok) {
        const r = redo(u.state);
        if (r.ok) redo(r.state);
      }
    }, Math.max(10, Math.floor(iterations / 5)));
  }

  return table;
}

describe('spatial core performance (micro)', () => {
  it('records average ms per operation and stays within soft budget', () => {
    const counts = [10, 25, 50, 100];
    const table = benchTable(counts, 200);

    // Soft guard: 100-item collision scan should stay well below 5ms avg on dev hardware.
    expect(table.COLLISION[100]).toBeLessThan(5);

    console.table(
      counts.map((n) => ({
        items: n,
        MOVE_ms: table.MOVE[n].toFixed(4),
        ROTATE_ms: table.ROTATE[n].toFixed(4),
        COLLISION_ms: table.COLLISION[n].toFixed(4),
        UNDO_ms: table.UNDO[n].toFixed(4),
        REDO_ms: table.REDO[n].toFixed(4),
        SERIALIZE_ms: table.SERIALIZE[n].toFixed(4),
      })),
    );
  });
});
