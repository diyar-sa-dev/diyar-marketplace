import { useEffect, useState, type RefObject } from 'react';
import { ROOM_DESIGNER_CANVAS_MIN_HEIGHT_PX } from './constants.ts';

export function useContainerSize(containerRef: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 640, height: 480 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(ROOM_DESIGNER_CANVAS_MIN_HEIGHT_PX, Math.floor(rect.height));
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}
