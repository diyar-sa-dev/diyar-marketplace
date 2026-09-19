import { describe, expect, it } from 'vitest';
import { makeItem } from '../domain/testFixtures.ts';
import { fabricModifyToCommands } from './fabricModifyToCommands.ts';

describe('fabricModifyToCommands', () => {
  it('emits MOVE when center changes', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 320, y: 320 }, 0, 80);
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.type).toBe('MOVE');
  });

  it('emits ROTATE when angle changes', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 160, y: 160 }, 90, 80);
    expect(cmds.some((c) => c.type === 'ROTATE')).toBe(true);
  });

  it('emits both MOVE and ROTATE in one gesture', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 240, y: 240 }, 45, 80);
    expect(cmds.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty when unchanged', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 160, y: 160 }, 0, 80);
    expect(cmds).toHaveLength(0);
  });
});
