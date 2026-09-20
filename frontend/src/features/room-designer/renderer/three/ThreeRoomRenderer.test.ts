/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { createDocumentFromPreset } from '../../domain/room/initializeFromPreset.ts';
import { ThreeRoomRenderer } from './ThreeRoomRenderer.ts';

describe('ThreeRoomRenderer', () => {
  it('shows fallback when WebGL is unavailable (jsdom)', async () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const renderer = new ThreeRoomRenderer();
    renderer.mount(container, { widthPx: 400, heightPx: 300 });
    await new Promise((r) => setTimeout(r, 80));
    const fallback = container.querySelector('[data-testid="room-designer-3d-unavailable"]');
    expect(fallback).toBeTruthy();
    renderer.destroy();
    container.remove();
    HTMLCanvasElement.prototype.getContext = orig;
  });

  it('destroy clears container after mount attempt', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const renderer = new ThreeRoomRenderer();
    renderer.mount(container, { widthPx: 320, heightPx: 240 });
    await new Promise((r) => setTimeout(r, 30));
    renderer.destroy();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it('render does not throw before WebGL init completes', () => {
    const preset = createDocumentFromPreset('salon');
    if (!preset.ok) throw new Error('preset');
    const renderer = new ThreeRoomRenderer();
    expect(() => renderer.render(preset.document, { scalePxPerM: 80, projection: 'room_3d' })).not.toThrow();
    renderer.destroy();
  });
});
