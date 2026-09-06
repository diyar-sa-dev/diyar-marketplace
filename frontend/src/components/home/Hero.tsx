import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

const SLIDE_CONFIG = [
  {
    titleKey: 'home.hero.slide1Title',
    subKey: 'home.hero.slide1Sub',
    ctaKey: 'home.hero.slide1Cta',
    to: '/category/all',
    img: '/hero_1.webp',
  },
  {
    titleKey: 'home.hero.slide2Title',
    subKey: 'home.hero.slide2Sub',
    ctaKey: 'home.hero.slide2Cta',
    to: '/ai-designer',
    img: '/hero_2.webp',
  },
  {
    titleKey: 'home.hero.slide3Title',
    subKey: 'home.hero.slide3Sub',
    ctaKey: 'home.hero.slide3Cta',
    to: '/auth?role=marketer',
    img: '/hero_3.webp',
  },
] as const;

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920';

export default function Hero() {
  const { t, dir } = useLocale();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slideCount = SLIDE_CONFIG.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo(current - 1);
  }, [current, goTo]);

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [paused, goNext]);

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="bg-white">
      <div
        className="relative h-[min(88vh,720px)] md:h-[calc(100vh-48px)] w-full overflow-hidden rounded-b-3xl md:rounded-b-4xl shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {SLIDE_CONFIG.map((slide, i) => (
          <div
            key={slide.titleKey}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            {...(i !== current ? { inert: true } : {})}
          >
            <img
              src={slide.img}
              alt=""
              width={1920}
              height={1080}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'auto'}
              loading={i === 0 ? 'eager' : 'lazy'}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover scale-105 will-change-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_HERO;
              }}
            />
            <div
              className={`absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/20 md:from-black/75 md:via-black/35 md:to-transparent ${
                dir === 'rtl' ? 'md:bg-linear-to-l' : 'md:bg-linear-to-r'
              }`}
            />
            <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-16 lg:px-20 flex items-end md:items-center pb-24 md:pb-0 justify-center md:justify-start text-center md:text-start">
              <div className="text-white max-w-xl md:max-w-lg space-y-4 md:space-y-6 mb-2 md:mb-0">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md">
                  {i + 1} / {slideCount}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold leading-snug tracking-tight">
                  {t(slide.titleKey)}
                </h1>
                <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/90 max-w-prose mx-auto md:mx-0">
                  {t(slide.subKey)}
                </p>
                <Link
                  to={slide.to}
                  className="inline-flex items-center justify-center gap-2 bg-diyar-brown text-white px-7 py-3.5 rounded-2xl md:rounded-xl font-sans text-base md:text-lg font-bold hover:bg-[#856b54] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-black/25 w-full sm:w-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t(slide.ctaKey)}
                </Link>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={goPrev}
          aria-label={t('home.hero.prev')}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white p-3.5 rounded-full backdrop-blur-md border border-white/15 transition-all cursor-pointer inset-s-6 lg:inset-s-8 hover:scale-105"
        >
          <PrevIcon size={22} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={t('home.hero.next')}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white p-3.5 rounded-full backdrop-blur-md border border-white/15 transition-all cursor-pointer inset-e-6 lg:inset-e-8 hover:scale-105"
        >
          <NextIcon size={22} />
        </button>

        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2.5 z-20 px-4">
          {SLIDE_CONFIG.map((slide, i) => (
            <button
              key={slide.titleKey}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('home.hero.goToSlide', { n: i + 1 })}
              aria-pressed={i === current}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === current
                  ? 'w-8 bg-diyar-brown shadow-md shadow-diyar-brown/40'
                  : 'w-2.5 bg-white/45 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
