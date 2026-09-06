import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Truck,
  Gift,
  ChevronLeft,
  ChevronRight,
  X,
  Percent,
  Sofa,
  Star,
  Megaphone,
} from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { fetchPlatformAnnouncement } from '../../api/platformAnnouncement.ts';

type AnnouncementSlide = {
  icon: React.ReactNode;
  text: string;
  cta: string;
  link: string;
};

export function AnnouncementBar() {
  const { t, locale } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const { data: customAnnouncement } = useQuery({
    queryKey: ['platform-announcement', locale],
    queryFn: fetchPlatformAnnouncement,
    staleTime: 120_000,
  });

  const announcements = useMemo(() => {
    const defaults: AnnouncementSlide[] = [
      {
        icon: <Gift className="w-4 h-4 text-diyar-cream shrink-0" />,
        text: t('home.announcements.item1Text'),
        cta: t('home.announcements.item1Cta'),
        link: '/category/all?discounted=1&sort=-discount',
      },
      {
        icon: <Percent className="w-4 h-4 text-amber-300 shrink-0" />,
        text: t('home.announcements.item4Text'),
        cta: t('home.announcements.item4Cta'),
        link: '/category/living-room?sort=-popular',
      },
      {
        icon: <Sofa className="w-4 h-4 text-diyar-cream shrink-0" />,
        text: t('home.announcements.item5Text'),
        cta: t('home.announcements.item5Cta'),
        link: '/category/decor?sort=-popular',
      },
      {
        icon: <Star className="w-4 h-4 text-yellow-400 shrink-0" />,
        text: t('home.announcements.item6Text'),
        cta: t('home.announcements.item6Cta'),
        link: '/category/all?sort=-popular',
      },
      {
        icon: <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />,
        text: t('home.announcements.item2Text'),
        cta: t('home.announcements.item2Cta'),
        link: '/ai-designer',
      },
      {
        icon: <Truck className="w-4 h-4 text-diyar-cream shrink-0" />,
        text: t('home.announcements.item3Text'),
        cta: t('home.announcements.item3Cta'),
        link: '/profile/addresses',
      },
    ];

    if (customAnnouncement?.enabled && customAnnouncement.text) {
      return [
        {
          icon: <Megaphone className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />,
          text: customAnnouncement.text,
          cta: customAnnouncement.cta,
          link: customAnnouncement.link || '/',
        },
        ...defaults,
      ];
    }

    return defaults;
  }, [customAnnouncement, t]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [customAnnouncement?.enabled, customAnnouncement?.text]);

  useEffect(() => {
    if (!isVisible || isClosing) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isVisible, isClosing, announcements.length]);

  const current = announcements[currentIndex] ?? announcements[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="top-announcement-bar"
      className={`w-full bg-linear-to-r from-[#132624] via-[#1a3330] to-[#132624] text-diyar-cream border-b border-[#2a4a44] text-xs font-medium relative overflow-hidden py-2.5 ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } transition-opacity duration-200`}
      {...(isClosing ? { inert: true } : {})}
      onTransitionEnd={() => {
        if (isClosing) {
          setIsVisible(false);
        }
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between relative z-10 gap-2">
        <button
          onClick={handlePrev}
          className="hidden md:flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer min-w-11 min-h-11 hover:bg-white/10 rounded-full shrink-0"
          title={t('home.announcements.prev')}
          aria-label={t('home.announcements.prev')}
          id="btn-announcement-prev"
        >
          <ChevronRight size={14} />
        </button>

        <div className="flex-1 flex justify-center items-center overflow-hidden min-h-5.5">
          <div
            key={currentIndex}
            className="flex items-center justify-center gap-2 md:gap-3 text-center px-2 md:px-4 animate-[announcementFade_0.45s_ease-out]"
          >
            {current.icon}
            <span className="text-[11px] sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-1">
              {current.text}
            </span>
            {current.link ? (
              <Link
                to={current.link}
                className="hidden sm:inline-flex bg-diyar-brown hover:bg-[#a6886f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer ms-1 shrink-0"
              >
                {current.cta}
              </Link>
            ) : (
              <span className="hidden sm:inline-flex bg-white/10 text-diyar-cream/90 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 ms-1 shrink-0">
                {current.cta}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleNext}
            className="hidden md:flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer min-w-11 min-h-11 hover:bg-white/10 rounded-full"
            title={t('home.announcements.next')}
            aria-label={t('home.announcements.next')}
            id="btn-announcement-next"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            onClick={() => setIsClosing(true)}
            className="text-white/50 hover:text-diyar-cream hover:bg-white/10 min-w-11 min-h-11 inline-flex items-center justify-center p-1.5 rounded-full transition-all cursor-pointer shrink-0"
            title={t('home.announcements.close')}
            aria-label={t('home.announcements.close')}
            id="btn-announcement-close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
