import { describe, expect, it } from 'vitest';
import { DesignerSession } from './DesignerSession.ts';
import { applySuggestedLayout } from './applySuggestedLayout.ts';
import { createDocumentFromPreset } from '../domain/room/initializeFromPreset.ts';
import { makeItem } from '../domain/testFixtures.ts';

describe('applySuggestedLayout (30.16)', () => {
  it('applies valid suggestions through the spatial engine', () => {
    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'i1', position_m: { x: 2, z: 2.5 }, snapshot: { width_m: 1, depth_m: 1 } })];
    const session = new DesignerSession({ document: doc, history: { past: [], future: [] } });

    const result = applySuggestedLayout(session, doc, [
      { type: 'MOVE', itemId: 'i1', position_m: { x: 3, z: 3 } },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const moved = result.state.document.items.find((i) => i.id === 'i1');
      expect(moved?.position_m.x).toBe(3);
    }
  });

  it('rejects suggestions that violate room boundary (constraint engine)', () => {
    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'i1', position_m: { x: 1, z: 1 } })];
    const session = new DesignerSession({ document: doc, history: { past: [], future: [] } });

    const result = applySuggestedLayout(session, doc, [
      { type: 'MOVE', itemId: 'i1', position_m: { x: 999, z: 999 } },
    ]);
    expect(result.ok).toBe(false);
  });
});
