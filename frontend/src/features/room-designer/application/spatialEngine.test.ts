import { describe, expect, it } from 'vitest';
import { DomainErrorCode } from '../domain/errors.ts';
import { MAX_HISTORY } from '../domain/constants.ts';
import { createEmptyDocument } from '../domain/models.ts';
import { makeItem } from '../domain/testFixtures.ts';
import {
  createSpatialEngine,
  engineCanRedo,
  executeCommand,
  redo,
  undo,
} from './spatialEngine.ts';

describe('spatialEngine', () => {
  it('rejects move outside room', () => {
    let state = createSpatialEngine(5, 5);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'sofa', position_m: { x: 2, z: 2 } }),
    });
    expect(add.ok).toBe(true);
    if (!add.ok) return;

    const move = executeCommand(add.state, {
      type: 'MOVE',
      itemId: 'sofa',
      position_m: { x: 0.2, z: 0.2 },
    });
    expect(move.ok).toBe(false);
    if (move.ok === false) {
      expect(move.error.code).toBe(DomainErrorCode.OUTSIDE_ROOM);
    }
  });

  it('blocks mutations on locked items', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'locked-sofa' }),
    });
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    state = add.state;

    const lock = executeCommand(state, { type: 'LOCK', itemId: 'locked-sofa' });
    expect(lock.ok).toBe(true);
    if (!lock.ok) return;

    const move = executeCommand(lock.state, {
      type: 'MOVE',
      itemId: 'locked-sofa',
      position_m: { x: 3, z: 3 },
    });
    expect(move.ok).toBe(false);
    if (move.ok === false) {
      expect(move.error.code).toBe(DomainErrorCode.ITEM_LOCKED);
    }

    const remove = executeCommand(lock.state, { type: 'REMOVE_ITEM', itemId: 'locked-sofa' });
    expect(remove.ok).toBe(false);
  });

  it('undo and redo restore move', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'chair', position_m: { x: 2, z: 2 } }),
    });
    if (!add.ok) throw new Error('add failed');
    state = add.state;

    const move = executeCommand(state, {
      type: 'MOVE',
      itemId: 'chair',
      position_m: { x: 3, z: 3 },
    });
    if (!move.ok) throw new Error('move failed');
    expect(move.state.document.items[0]?.position_m).toEqual({ x: 3, z: 3 });

    const undone = undo(move.state);
    if (!undone.ok) throw new Error('undo failed');
    expect(undone.state.document.items[0]?.position_m).toEqual({ x: 2, z: 2 });
    expect(engineCanRedo(undone.state)).toBe(true);

    const redone = redo(undone.state);
    if (!redone.ok) throw new Error('redo failed');
    expect(redone.state.document.items[0]?.position_m).toEqual({ x: 3, z: 3 });
  });

  it('invalidates redo branch after new command', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'table' }),
    });
    if (!add.ok) throw new Error('add failed');
    state = add.state;
    const move = executeCommand(state, {
      type: 'MOVE',
      itemId: 'table',
      position_m: { x: 3, z: 2.5 },
    });
    if (!move.ok) throw new Error('move failed');
    const undone = undo(move.state);
    if (!undone.ok) throw new Error('undo failed');
    expect(engineCanRedo(undone.state)).toBe(true);

    const rotate = executeCommand(undone.state, {
      type: 'ROTATE',
      itemId: 'table',
      rotation_deg: 90,
    });
    if (!rotate.ok) throw new Error('rotate failed');
    expect(engineCanRedo(rotate.state)).toBe(false);
  });

  it('clear room is undoable', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, { type: 'ADD_ITEM', item: makeItem({ id: 'x' }) });
    if (!add.ok) throw new Error('add failed');
    const cleared = executeCommand(add.state, { type: 'CLEAR_ROOM' });
    if (!cleared.ok) throw new Error('clear failed');
    expect(cleared.state.document.items).toHaveLength(0);

    const undone = undo(cleared.state);
    if (!undone.ok) throw new Error('undo failed');
    expect(undone.state.document.items).toHaveLength(1);
    expect(undone.state.document.items[0]?.id).toBe('x');
  });

  it('rejects room resize that violates bounds', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'big', position_m: { x: 3, z: 3 } }),
    });
    if (!add.ok) throw new Error('add failed');
    const resizeRoom = executeCommand(add.state, {
      type: 'SET_ROOM_SIZE',
      width_m: 3,
      depth_m: 3,
    });
    expect(resizeRoom.ok).toBe(false);
    if (resizeRoom.ok === false) {
      expect(resizeRoom.error.code).toBe(DomainErrorCode.ROOM_SIZE_CAUSES_VIOLATIONS);
    }
  });

  it('rejects catalog resize in V1', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, { type: 'ADD_ITEM', item: makeItem({ id: 'r' }) });
    if (!add.ok) throw new Error('add failed');
    const resize = executeCommand(add.state, {
      type: 'RESIZE',
      itemId: 'r',
      width_m: 3,
      depth_m: 1,
    });
    expect(resize.ok).toBe(false);
    if (resize.ok === false) {
      expect(resize.error.code).toBe(DomainErrorCode.RESIZE_NOT_ALLOWED);
    }
  });

  it('bounds history to 50 entries', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, { type: 'ADD_ITEM', item: makeItem({ id: 'h' }) });
    if (!add.ok) throw new Error('add failed');
    state = add.state;

    for (let i = 0; i < MAX_HISTORY + 5; i += 1) {
      const rot = executeCommand(state, {
        type: 'ROTATE',
        itemId: 'h',
        rotation_deg: (i + 1) * 5,
      });
      if (!rot.ok) throw new Error(`rotate failed at ${i}`);
      state = rot.state;
    }
    expect(state.history.past.length).toBeLessThanOrEqual(MAX_HISTORY);
  });

  it('duplicate creates new id and offset position', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'source', position_m: { x: 2, z: 2 } }),
    });
    if (!add.ok) throw new Error('add failed');
    const dup = executeCommand(add.state, { type: 'DUPLICATE', itemId: 'source' });
    if (!dup.ok) throw new Error('duplicate failed');
    expect(dup.state.document.items).toHaveLength(2);
    const copy = dup.state.document.items.find((i) => i.id !== 'source');
    expect(copy?.position_m.x).toBeCloseTo(2.2);
    expect(copy?.position_m.z).toBeCloseTo(2.2);
  });
});

describe('rotation normalization in commands', () => {
  it('stores normalized rotation after rotate command', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, { type: 'ADD_ITEM', item: makeItem({ id: 'rot' }) });
    if (!add.ok) throw new Error('add failed');
    const rot = executeCommand(add.state, { type: 'ROTATE', itemId: 'rot', rotation_deg: 450 });
    if (!rot.ok) throw new Error('rotate failed');
    expect(rot.state.document.items[0]?.rotation_deg).toBe(90);
  });
});

describe('serialization contract', () => {
  it('round-trips document json', async () => {
    const { serializeDocument, parseDocument } = await import('../domain/serialization.ts');
    const doc = createEmptyDocument(4, 5);
    doc.items = [makeItem()];
    const json = serializeDocument(doc);
    const parsed = parseDocument(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.document.room.width_m).toBe(4);
    expect(parsed.document.items[0]?.product_id).toBe('550e8400-e29b-41d4-a716-446655440042');
  });
});
