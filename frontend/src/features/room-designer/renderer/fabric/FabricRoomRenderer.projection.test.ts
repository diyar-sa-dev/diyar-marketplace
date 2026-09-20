/**
 * @vitest-environment jsdom
 */
import type { Canvas } from 'fabric';
import { describe, expect, it } from 'vitest';
import { createDocumentFromPreset } from '../../domain/room/initializeFromPreset.ts';
import { makeItem } from '../../domain/testFixtures.ts';
import { FabricRoomRenderer } from './FabricRoomRenderer.ts';

describe('FabricRoomRenderer projection hardening', () => {
  it('places top_down item center at scaled world position', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const renderer = new FabricRoomRenderer();
    renderer.mount(container, { widthPx: 640, heightPx: 480, scalePxPerM: 80 });

    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'c1', position_m: { x: 2, z: 2 } })];

    renderer.render(doc, { scalePxPerM: 80, projection: 'top_down' });

    const fabricCanvas = (renderer as unknown as {
      canvas: Canvas & {
        getObjects: () => Array<{ diyarItemId?: string; left?: number; top?: number }>;
      };
    }).canvas;
    const obj = fabricCanvas.getObjects().find((o) => o.diyarItemId === 'c1');
    expect(obj?.left).toBeCloseTo(160, 0);
    expect(obj?.top).toBeCloseTo(160, 0);

    renderer.destroy();
    container.remove();
  });

  it('keeps isometric projection after viewport resize', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const renderer = new FabricRoomRenderer();
    renderer.mount(container, { widthPx: 640, heightPx: 480, scalePxPerM: 80 });

    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const doc = preset.document;
    doc.items = [makeItem({ id: 'iso1', position_m: { x: 2, z: 2 } })];

    renderer.render(doc, { scalePxPerM: 80, projection: 'isometric_25d' });
    renderer.resizeViewport(400, 300);

    const fabricCanvas = (renderer as unknown as {
      canvas: Canvas & { getObjects: () => Array<{ type?: string; diyarItemId?: string }> };
    }).canvas;
    const floor = fabricCanvas.getObjects().find((o) => !o.diyarItemId);
    expect(floor?.type).toBe('polygon');

    renderer.destroy();
    container.remove();
  });

  it('cleans up after repeated mount/destroy cycles', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    for (let i = 0; i < 5; i += 1) {
      const renderer = new FabricRoomRenderer();
      renderer.mount(container, { widthPx: 320, heightPx: 240, scalePxPerM: 80 });
      const preset = createDocumentFromPreset('bedroom');
      if (!preset.ok) throw new Error('preset');
      renderer.render(preset.document, { scalePxPerM: 80 });
      renderer.destroy();
    }
    expect(container.querySelectorAll('canvas').length).toBe(0);
    container.remove();
  });
});
