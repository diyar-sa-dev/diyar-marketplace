import { describe, expect, it } from 'vitest';
import { makeItem } from '../testFixtures.ts';
import { createSpatialEngine, executeCommand, undo } from '../../application/spatialEngine.ts';

describe('BATCH command', () => {
  it('undoes move+rotate atomically', () => {
    let engine = createSpatialEngine(6, 6);
    const add = executeCommand(engine, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'x', position_m: { x: 2, z: 2 } }),
    });
    if (!add.ok) throw new Error('add failed');
    engine = add.state;

    const batch = executeCommand(engine, {
      type: 'BATCH',
      commands: [
        { type: 'MOVE', itemId: 'x', position_m: { x: 3, z: 2.5 } },
        { type: 'ROTATE', itemId: 'x', rotation_deg: 180 },
      ],
    });
    if (!batch.ok) throw new Error('batch failed');
    const undone = undo(batch.state);
    if (!undone.ok) throw new Error('undo failed');
    expect(undone.state.document.items[0]?.position_m).toEqual({ x: 2, z: 2 });
    expect(undone.state.document.items[0]?.rotation_deg).toBe(0);
  });
});
