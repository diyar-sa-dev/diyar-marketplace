import { describe, expect, it } from 'vitest';
import { DomainErrorCode } from '../domain/errors.ts';
import { makeItem } from '../domain/testFixtures.ts';
import { createSpatialEngine, executeCommand } from './spatialEngine.ts';
import { DesignerSession } from './DesignerSession.ts';

describe('DesignerSession interaction history', () => {
  it('records one history entry for BATCH move+rotate', () => {
    let engine = createSpatialEngine(6, 6);
    const add = executeCommand(engine, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'a', position_m: { x: 2, z: 2 } }),
    });
    if (!add.ok) throw new Error('add failed');
    const session = new DesignerSession(add.state);
    const result = session.applyCommands([
      { type: 'MOVE', itemId: 'a', position_m: { x: 3, z: 3 } },
      { type: 'ROTATE', itemId: 'a', rotation_deg: 90 },
    ]);
    expect(result.ok).toBe(true);
    expect(session.canUndo()).toBe(true);
    session.undo();
    expect(session.getDocument().items[0]?.position_m).toEqual({ x: 2, z: 2 });
    expect(session.getDocument().items[0]?.rotation_deg).toBe(0);
  });

  it('rejects move outside room without mutating session document', () => {
    let engine = createSpatialEngine(5, 5);
    const add = executeCommand(engine, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'b', position_m: { x: 2.5, z: 2.5 } }),
    });
    if (!add.ok) throw new Error('add failed');
    const session = new DesignerSession(add.state);
    const before = session.getDocument().items[0]?.position_m;
    const bad = session.applyCommands([
      { type: 'MOVE', itemId: 'b', position_m: { x: 0.2, z: 0.2 } },
    ]);
    expect(bad.ok).toBe(false);
    if (bad.ok === false) {
      expect(bad.error.code).toBe(DomainErrorCode.OUTSIDE_ROOM);
    }
    expect(session.getDocument().items[0]?.position_m).toEqual(before);
  });

  it('removeSelected clears selection', () => {
    let engine = createSpatialEngine(6, 6);
    const add = executeCommand(engine, { type: 'ADD_ITEM', item: makeItem({ id: 'r' }) });
    if (!add.ok) throw new Error('add failed');
    const session = new DesignerSession(add.state);
    session.setSelection(['r']);
    session.removeSelected();
    expect(session.getDocument().items).toHaveLength(0);
    expect(session.selectedIds).toHaveLength(0);
  });
});
