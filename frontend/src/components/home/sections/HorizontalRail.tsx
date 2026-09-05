import React, { useRef, type ReactNode, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHorizontalRailScroll } from '../../../hooks/useHorizontalRailScroll.ts';
import { useLocale } from '../../../hooks/useLocale.ts';

type RailControlsProps = {
  scroller: RefObject<HTMLElement | null>;
  className?: string;
  hideWhenNoOverflow?: boolean;
};

export function RailControls({
  scroller,
  className = '',
  hideWhenNoOverflow = true,
}: RailControlsProps) {
  const { t, dir } = useLocale();
  const { overflow, canScrollStart, canScrollEnd, scrollByPage } = useHorizontalRailScroll(scroller);

  if (hideWhenNoOverflow && !overflow) {
    return null;
  }

  const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const buttonBase =
    'inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diyar-brown/40';
  const enabled = 'text-diyar-dark hover:bg-diyar-brown hover:text-white cursor-pointer';
  const disabled = 'text-gray-300 cursor-not-allowed opacity-50';

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-gray-200/90 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm ${className}`}
      aria-hidden={!overflow}
    >
      <button
        type="button"
        aria-label={t('home.hero.prev')}
        disabled={!canScrollStart}
        onClick={() => scrollByPage(-1)}
        className={`${buttonBase} ${canScrollStart ? enabled : disabled}`}
      >
        <BackIcon size={17} strokeWidth={2.25} />
      </button>
      <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden="true" />
      <button
        type="button"
        aria-label={t('home.hero.next')}
        disabled={!canScrollEnd}
        onClick={() => scrollByPage(1)}
        className={`${buttonBase} ${canScrollEnd ? enabled : disabled}`}
      >
        <ForwardIcon size={17} strokeWidth={2.25} />
      </button>
    </div>
  );
}

type HorizontalRailProps = {
  children: ReactNode;
  className?: string;
  controlsClassName?: string;
  hideControlsWhenNoOverflow?: boolean;
};

export function HorizontalRail({
  children,
  className = '',
  controlsClassName = '',
  hideControlsWhenNoOverflow = true,
}: HorizontalRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-2 md:gap-2.5">
      <div className={`flex justify-end ${controlsClassName}`}>
        <RailControls
          scroller={scrollerRef}
          hideWhenNoOverflow={hideControlsWhenNoOverflow}
        />
      </div>
      <div ref={scrollerRef} className={className}>
        {children}
      </div>
    </div>
  );
}

/** @deprecated Use HorizontalRail or RailControls instead. */
export function RailArrows({ scroller }: { scroller: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="mb-2 flex justify-end">
      <RailControls scroller={scroller} />
    </div>
  );
}
