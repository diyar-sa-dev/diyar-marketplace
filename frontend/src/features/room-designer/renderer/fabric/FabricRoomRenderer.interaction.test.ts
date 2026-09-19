/**
 * @vitest-environment jsdom
 */
import type { Canvas } from 'fabric';
import { describe, expect, it } from 'vitest';
import { DesignerSession } from '../../application/DesignerSession.ts';
import { createDocumentFromPreset } from '../../domain/room/initializeFromPreset.ts';
import { makeItem } from '../../domain/testFixtures.ts';
import { FabricRoomRenderer } from './FabricRoomRenderer.ts';

describe('FabricRoomRenderer interaction', () => {
  it('emits MOVE command on object:modified (one history step via session)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'drag-me', position_m: { x: 2, z: 2 } })];

    const session = new DesignerSession({ document: doc, history: { past: [], future: [] } });
    const renderer = new FabricRoomRenderer();
    renderer.mount(container, { widthPx: 640, heightPx: 480, scalePxPerM: 80 });
    renderer.render(session.getDocument(), { scalePxPerM: 80 });

    renderer.onInteraction((event) => {
      if (event.type === 'command') {
        const cmds = event.command.type === 'BATCH' ? event.command.commands : [event.command];
        session.applyCommands(cmds);
        renderer.render(session.getDocument(), { scalePxPerM: 80 });
      }
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();

    // Simulate end-of-drag via fabric internal API
    const fabricCanvas = (renderer as unknown as {
      canvas: Canvas & {
        getObjects: () => Array<{ diyarItemId?: string; set: (p: object) => void }>;
        fire: (name: string, payload: { target: unknown }) => void;
      };
    }).canvas;
    const obj = fabricCanvas.getObjects().find((o) => o.diyarItemId === 'drag-me');
    expect(obj).toBeTruthy();
    obj?.set({ left: 240, top: 240 });
    fabricCanvas.fire('object:modified', { target: obj });

    expect(session.getDocument().items[0]?.position_m.x).toBeCloseTo(3, 0);
    expect(session.getDocument().items[0]?.position_m.z).toBeCloseTo(3, 0);
    expect(session.canUndo()).toBe(true);

    session.undo();
    renderer.render(session.getDocument(), { scalePxPerM: 80 });
    expect(session.getDocument().items[0]?.position_m).toEqual({ x: 2, z: 2 });

    renderer.destroy();
    container.remove();
  });
});
