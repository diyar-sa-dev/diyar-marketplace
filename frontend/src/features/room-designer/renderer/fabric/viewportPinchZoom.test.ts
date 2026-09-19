/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { attachViewportPinchZoom } from './viewportPinchZoom.ts';

function touchPair(x1: number, x2: number): TouchList {
  const touches = [
    { identifier: 0, clientX: x1, clientY: 0 },
    { identifier: 1, clientX: x2, clientY: 0 },
  ] as unknown as Touch[];
  return touches as unknown as TouchList;
}

describe('attachViewportPinchZoom', () => {
  it('adjusts canvas zoom on two-finger pinch without touching document', () => {
    const zoomToPoint = vi.fn();
    const getZoom = vi.fn(() => 1);
    const getCenter = vi.fn(() => ({ left: 100, top: 80 }));
    const requestRenderAll = vi.fn();
    const canvas = { zoomToPoint, getZoom, getCenter, requestRenderAll } as unknown as import('fabric').Canvas;

    const surface = document.createElement('div');
    const detach = attachViewportPinchZoom(canvas, surface);

    const touchStart = new Event('touchstart', { bubbles: true }) as TouchEvent;
    Object.defineProperty(touchStart, 'touches', { value: touchPair(0, 100) });
    surface.dispatchEvent(touchStart);

    const touchMove = new Event('touchmove', { bubbles: true, cancelable: true }) as TouchEvent;
    Object.defineProperty(touchMove, 'touches', { value: touchPair(0, 200) });
    surface.dispatchEvent(touchMove);

    expect(zoomToPoint).toHaveBeenCalled();
    expect(getZoom).toHaveBeenCalled();

    detach();
  });
});
