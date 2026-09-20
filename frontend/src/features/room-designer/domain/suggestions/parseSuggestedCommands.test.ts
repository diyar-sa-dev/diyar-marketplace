import { describe, expect, it } from 'vitest';
import { parseSuggestedCommands } from './parseSuggestedCommands.ts';

const known = new Set(['a', 'b']);

describe('parseSuggestedCommands (30.16)', () => {
  it('accepts MOVE and ROTATE for known items', () => {
    const result = parseSuggestedCommands(
      [
        { type: 'MOVE', itemId: 'a', position_m: { x: 1, z: 2 } },
        { type: 'ROTATE', itemId: 'b', rotation_deg: 90 },
      ],
      known,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.commands).toHaveLength(2);
    }
  });

  it('rejects destructive or document-mutating types', () => {
    for (const type of ['CLEAR_ROOM', 'ADD_ITEM', 'REMOVE_ITEM', 'SET_ROOM_SIZE']) {
      const result = parseSuggestedCommands([{ type, itemId: 'a' }], known);
      expect(result.ok).toBe(false);
    }
  });

  it('rejects unknown item ids and non-finite coordinates', () => {
    expect(parseSuggestedCommands([{ type: 'MOVE', itemId: 'x', position_m: { x: 1, z: 1 } }], known).ok).toBe(
      false,
    );
    expect(
      parseSuggestedCommands([{ type: 'MOVE', itemId: 'a', position_m: { x: NaN, z: 1 } }], known).ok,
    ).toBe(false);
  });

  it('rejects oversized command lists', () => {
    const many = Array.from({ length: 51 }, () => ({
      type: 'MOVE',
      itemId: 'a',
      position_m: { x: 1, z: 1 },
    }));
    expect(parseSuggestedCommands(many, known).ok).toBe(false);
  });

  it('rejects nested BATCH containing forbidden inner commands', () => {
    const batch = {
      type: 'BATCH',
      commands: [{ type: 'REMOVE_ITEM', itemId: 'a' }],
    };
    expect(parseSuggestedCommands([batch], known).ok).toBe(false);
  });

  it('parses nested BATCH with depth limit', () => {
    const deep = {
      type: 'BATCH',
      commands: [
        {
          type: 'BATCH',
          commands: [{ type: 'MOVE', itemId: 'a', position_m: { x: 1, z: 1 } }],
        },
      ],
    };
    expect(parseSuggestedCommands([deep], known).ok).toBe(true);
    const tooDeep = {
      type: 'BATCH',
      commands: [
        {
          type: 'BATCH',
          commands: [
            {
              type: 'BATCH',
              commands: [{ type: 'MOVE', itemId: 'a', position_m: { x: 1, z: 1 } }],
            },
          ],
        },
      ],
    };
    expect(parseSuggestedCommands([tooDeep], known).ok).toBe(false);
  });
});
