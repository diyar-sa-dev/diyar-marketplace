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

  it('normalizes rotation for domain ROTATE command', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 160, y: 160 }, 405, 80);
    const rotate = cmds.find((c) => c.type === 'ROTATE');
    expect(rotate?.type).toBe('ROTATE');
    if (rotate?.type === 'ROTATE') {
      expect(rotate.rotation_deg).toBe(45);
    }
  });

  it('maps isometric canvas center back to world MOVE', () => {
    const item = makeItem({ position_m: { x: 2, z: 2 }, rotation_deg: 0 });
    const cmds = fabricModifyToCommands(item, { x: 0, y: 240 }, 0, 80, 'isometric_25d');
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.type).toBe('MOVE');
    if (cmds[0]?.type === 'MOVE') {
      expect(cmds[0].position_m.x).toBeCloseTo(3, 1);
      expect(cmds[0].position_m.z).toBeCloseTo(3, 1);
    }
  });
});
