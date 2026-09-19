import type { Canvas } from 'fabric';

/** Viewport-only zoom — does not mutate RoomDesignDocument or emit commands. */
export function attachViewportPinchZoom(canvas: Canvas, surface: HTMLElement): () => void {
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  const distance = (t1: Touch, t2: Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      pinchStartDistance = distance(event.touches[0], event.touches[1]);
      pinchStartZoom = canvas.getZoom();
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 2 || pinchStartDistance <= 0) {
      return;
    }
    event.preventDefault();
    const nextDistance = distance(event.touches[0], event.touches[1]);
    const ratio = nextDistance / pinchStartDistance;
    const zoom = Math.min(4, Math.max(0.5, pinchStartZoom * ratio));
    const center = canvas.getCenter();
    canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
    canvas.requestRenderAll();
  };

  const onTouchEnd = () => {
    pinchStartDistance = 0;
  };

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.92 : 1.08;
    const zoom = Math.min(4, Math.max(0.5, canvas.getZoom() * delta));
    const point = canvas.getPointer(event);
    canvas.zoomToPoint(point, zoom);
    canvas.requestRenderAll();
  };

  surface.addEventListener('touchstart', onTouchStart, { passive: true });
  surface.addEventListener('touchmove', onTouchMove, { passive: false });
  surface.addEventListener('touchend', onTouchEnd);
  surface.addEventListener('touchcancel', onTouchEnd);
  surface.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    surface.removeEventListener('touchstart', onTouchStart);
    surface.removeEventListener('touchmove', onTouchMove);
    surface.removeEventListener('touchend', onTouchEnd);
    surface.removeEventListener('touchcancel', onTouchEnd);
    surface.removeEventListener('wheel', onWheel);
  };
}
