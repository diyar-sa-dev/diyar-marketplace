/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { DesignerSession } from '../../application/DesignerSession.ts';
import { createDocumentFromPreset } from '../../domain/room/initializeFromPreset.ts';
import { makeItem } from '../../domain/testFixtures.ts';
import { FabricRoomRenderer } from './FabricRoomRenderer.ts';

describe('FabricRoomRenderer render/modify drift', () => {
  it('domain position stable after many render cycles', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'drift', position_m: { x: 3.5, z: 2.25 } })];

    const session = new DesignerSession({ document: doc, history: { past: [], future: [] } });
    const renderer = new FabricRoomRenderer();
    renderer.mount(container, { widthPx: 640, heightPx: 480, scalePxPerM: 80 });

    for (let i = 0; i < 30; i += 1) {
      renderer.render(session.getDocument(), {
        scalePxPerM: 80,
        projection: i % 2 === 0 ? 'top_down' : 'isometric_25d',
      });
    }

    const pos = session.getDocument().items[0]?.position_m;
    expect(pos?.x).toBeCloseTo(3.5, 5);
    expect(pos?.z).toBeCloseTo(2.25, 5);

    renderer.destroy();
    container.remove();
  });
});
