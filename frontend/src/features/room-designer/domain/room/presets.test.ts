import { describe, expect, it } from 'vitest';
import { DomainErrorCode } from '../errors.ts';
import { centimetersToMeters } from '../units.ts';
import { createCustomRoomDocument, validateCustomRoom } from './customRoom.ts';
import { createDocumentFromPreset } from './initializeFromPreset.ts';
import { getRoomPreset, listRoomPresets, ROOM_PRESETS } from './presets.ts';
import {
  createSpatialEngine,
  executeCommand,
} from '../../application/spatialEngine.ts';
import { makeItem } from '../testFixtures.ts';

describe('room presets', () => {
  it('lists presets with meter dimensions', () => {
    expect(listRoomPresets().length).toBe(3);
    for (const preset of ROOM_PRESETS) {
      expect(preset.width_m).toBeGreaterThan(0);
      expect(preset.depth_m).toBeGreaterThan(0);
      expect(preset.height_m).toBeGreaterThan(0);
    }
  });

  it('aligns preset ids with sidebar background ids', () => {
    expect(getRoomPreset('majlis')?.id).toBe('majlis');
    expect(getRoomPreset('salon')?.id).toBe('salon');
    expect(getRoomPreset('bedroom')?.id).toBe('bedroom');
  });

  it('creates empty document from preset', () => {
    const result = createDocumentFromPreset('salon');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.room.preset_id).toBe('salon');
    expect(result.document.room.width_m).toBe(4.5);
    expect(result.document.items).toHaveLength(0);
  });

  it('rejects unknown preset', () => {
    const result = createDocumentFromPreset('unknown');
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.code).toBe(DomainErrorCode.UNKNOWN_ROOM_PRESET);
    }
  });

  it('validates custom room boundaries', () => {
    expect(validateCustomRoom(0.5, 5)).not.toBeNull();
    expect(validateCustomRoom(5, 5)).toBeNull();
  });

  it('creates custom room document', () => {
    const custom = createCustomRoomDocument(5, 5, 2.8);
    expect(custom.ok).toBe(true);
    if (custom.ok) {
      expect(custom.document.room.preset_id).toBeUndefined();
    }
  });

  it('does not store centimeters in preset dimensions', () => {
    const majlis = getRoomPreset('majlis');
    expect(majlis?.width_m).toBe(5.5);
    expect(centimetersToMeters(550)).toBe(5.5);
  });

  it('apply preset command updates room and preserves items when valid', () => {
    const init = createDocumentFromPreset('salon');
    if (!init.ok) throw new Error('init failed');
    let state = { document: init.document, history: { past: [], future: [] } };
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'a', position_m: { x: 2.5, z: 2.5 } }),
    });
    if (!add.ok) throw new Error('add failed');
    state = add.state;

    const apply = executeCommand(state, { type: 'APPLY_ROOM_PRESET', preset_id: 'bedroom' });
    expect(apply.ok).toBe(true);
    if (!apply.ok) return;
    expect(apply.state.document.room.preset_id).toBe('bedroom');
    expect(apply.state.document.room.width_m).toBe(4);
    expect(apply.state.document.items).toHaveLength(1);
  });

  it('rejects preset shrink that violates item bounds', () => {
    let state = createSpatialEngine(6, 6);
    const add = executeCommand(state, {
      type: 'ADD_ITEM',
      item: makeItem({ id: 'wide', position_m: { x: 5, z: 5 } }),
    });
    if (!add.ok) throw new Error('add failed');
    const apply = executeCommand(add.state, { type: 'APPLY_ROOM_PRESET', preset_id: 'bedroom' });
    expect(apply.ok).toBe(false);
    if (apply.ok === false) {
      expect(apply.error.code).toBe(DomainErrorCode.ROOM_SIZE_CAUSES_VIOLATIONS);
    }
  });

  it('custom SET_ROOM_SIZE clears preset_id', () => {
    const init = createDocumentFromPreset('majlis');
    if (!init.ok) throw new Error('init failed');
    let state = { document: init.document, history: { past: [], future: [] } };
    const resize = executeCommand(state, {
      type: 'SET_ROOM_SIZE',
      width_m: 6,
      depth_m: 6,
    });
    if (!resize.ok) throw new Error('resize failed');
    expect(resize.state.document.room.preset_id).toBeNull();
  });
});
