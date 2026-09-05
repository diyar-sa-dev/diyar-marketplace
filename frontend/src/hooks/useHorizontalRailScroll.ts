import { useCallback, useEffect, useState, type RefObject } from 'react';

export type HorizontalRailScrollState = {
  overflow: boolean;
  canScrollStart: boolean;
  canScrollEnd: boolean;
  scrollByPage: (direction: 1 | -1) => void;
};

const SCROLL_TOLERANCE_PX = 2;

function readScrollState(element: HTMLElement) {
  const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);

  if (maxScroll <= SCROLL_TOLERANCE_PX) {
    return { overflow: false, canScrollStart: false, canScrollEnd: false, maxScroll: 0 };
  }

  const isRtl = getComputedStyle(element).direction === 'rtl';
  let distanceFromStart: number;
  let distanceFromEnd: number;

  if (isRtl) {
    const { scrollLeft } = element;
    if (scrollLeft <= 0) {
      distanceFromStart = Math.abs(scrollLeft);
      distanceFromEnd = maxScroll - distanceFromStart;
    } else {
      distanceFromEnd = scrollLeft;
      distanceFromStart = maxScroll - distanceFromEnd;
    }
  } else {
    distanceFromStart = element.scrollLeft;
    distanceFromEnd = maxScroll - element.scrollLeft;
  }

  return {
    overflow: true,
    canScrollStart: distanceFromStart > SCROLL_TOLERANCE_PX,
    canScrollEnd: distanceFromEnd > SCROLL_TOLERANCE_PX,
    maxScroll,
  };
}

export function useHorizontalRailScroll(
  scrollerRef: RefObject<HTMLElement | null>,
): HorizontalRailScrollState {
  const [state, setState] = useState({
    overflow: false,
    canScrollStart: false,
    canScrollEnd: false,
  });

  const refresh = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) {
      return;
    }

    const next = readScrollState(element);
    setState({
      overflow: next.overflow,
      canScrollStart: next.canScrollStart,
      canScrollEnd: next.canScrollEnd,
    });
  }, [scrollerRef]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const element = scrollerRef.current;
      if (!element) {
        return;
      }

      const isRtl = getComputedStyle(element).direction === 'rtl';
      const offset = direction * Math.max(240, Math.round(element.clientWidth * 0.82));
      element.scrollBy({
        left: isRtl ? -offset : offset,
        behavior: 'smooth',
      });
    },
    [scrollerRef],
  );

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) {
      return;
    }

    refresh();

    element.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener('scroll', refresh);
      window.removeEventListener('resize', refresh);
      resizeObserver?.disconnect();
    };
  }, [refresh, scrollerRef]);

  return {
    ...state,
    scrollByPage,
  };
}
