import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';

export function RailArrows({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) {
  const { t, dir } = useLocale();
  const scroll = (dirOffset: number) =>
    scroller.current?.scrollBy({
      left: dirOffset * (dir === 'rtl' ? -340 : 340),
      behavior: 'smooth',
    });
  const base =
    'hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 items-center justify-center text-diyar-dark hover:bg-diyar-brown hover:text-white hover:border-diyar-brown transition-colors cursor-pointer';
  const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    <>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label={t('home.hero.next')}
        className={`${base} inset-e-0 translate-x-1/2`}
      >
        <ForwardIcon size={20} />
      </button>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label={t('home.hero.prev')}
        className={`${base} inset-s-0 -translate-x-1/2`}
      >
        <BackIcon size={20} />
      </button>
    </>
  );
}
