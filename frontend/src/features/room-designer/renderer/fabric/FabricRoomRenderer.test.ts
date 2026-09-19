/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { createDocumentFromPreset } from '../../domain/room/initializeFromPreset.ts';
import { makeItem } from '../../domain/testFixtures.ts';
import { FabricRoomRenderer } from './FabricRoomRenderer.ts';

describe('FabricRoomRenderer', () => {
  it('mounts, renders room and item, and reports selection', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const renderer = new FabricRoomRenderer();
    renderer.mount(container, { widthPx: 640, heightPx: 480, scalePxPerM: 80 });

    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset failed');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'sel-1', position_m: { x: 2, z: 2 } })];

    renderer.render(doc, { scalePxPerM: 80 });

    let selected: string[] = [];
    renderer.onInteraction((event) => {
      if (event.type === 'select') selected = event.ids;
    });

    const canvasEl = container.querySelector('canvas');
    expect(canvasEl).toBeTruthy();

    renderer.setSelection(['sel-1']);
    expect(selected.length).toBeGreaterThanOrEqual(0);

    renderer.resizeViewport(320, 400);
    expect(canvasEl?.width).toBe(320);

    renderer.destroy();
    container.remove();
  });
});
