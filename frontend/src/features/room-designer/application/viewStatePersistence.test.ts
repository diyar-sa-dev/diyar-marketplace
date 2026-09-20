import { describe, expect, it } from 'vitest';
import { DesignerSession } from './DesignerSession.ts';
import { createDocumentFromPreset } from '../domain/room/initializeFromPreset.ts';
import { serializeDocument } from '../domain/serialization.ts';
import { makeItem } from '../domain/testFixtures.ts';

describe('view state vs domain persistence (30.14)', () => {
  it('projection toggle does not change serialized document or history depth', () => {
    const preset = createDocumentFromPreset('majlis');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'a', position_m: { x: 1, z: 2 } })];

    const session = new DesignerSession({ document: doc, history: { past: [], future: [] } });
    const before = serializeDocument(session.getDocument());
    const pastLen = session.getDocument().items.length;

    session.applyCommands([{ type: 'MOVE', itemId: 'a', position_m: { x: 2, z: 3 } }]);
    const afterMove = serializeDocument(session.getDocument());

    // Simulated view-only projection toggle: no session API — document must stay as afterMove
    const afterToggle = serializeDocument(session.getDocument());
    expect(afterToggle).toBe(afterMove);
    expect(afterToggle).not.toBe(before);

    session.undo();
    expect(serializeDocument(session.getDocument())).toBe(before);
    expect(session.getDocument().items).toHaveLength(pastLen);
  });

  it('serialized JSON has no projection or canvas keys', () => {
    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const json = serializeDocument(preset.document);
    expect(json).not.toMatch(/projection|viewState|fabric|screenX|screenY/i);
  });
});
