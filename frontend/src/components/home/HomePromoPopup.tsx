import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  dismissPromoPopup,
  nextPromoAdIndex,
  shouldShowPromoPopup,
} from '../../lib/promoPopupStorage.ts';

type PromoAd = {
  id: string;
  imageSrc: string;
  link: string;
  altKey: string;
};

const PROMO_ADS: PromoAd[] = [
  {
    id: 'summer-offers-1',
    imageSrc: '/%D8%A8%D9%86%D8%B1%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%B5%D9%8A%D9%81.png',
    link: '/category/all?discounted=1&sort=-discount',
    altKey: 'home.adPopup.alt',
  },
  {
    id: 'summer-offers-2',
    imageSrc: '/%D8%A8%D9%86%D8%B1%20%D8%B9%D8%B1%D9%88%D8%B6%20%D8%A7%D9%84%D8%B5%D9%8A%D9%81%202.png',
    link: '/category/all?discounted=1&sort=-discount',
    altKey: 'home.adPopup.alt2',
  },
  {
    id: 'living-room-majlis',
    imageSrc: '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png',
    link: '/category/living-room?sort=-popular',
    altKey: 'home.adPopup.majlisAlt',
  },
  {
    id: 'decor-collection',
    imageSrc: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png',
    link: '/category/decor?sort=-popular',
    altKey: 'home.adPopup.decorAlt',
  },
];

const SHOW_DELAY_MS = 5000;

export function HomePromoPopup() {
  const { t, dir } = useLocale();
  const [visible, setVisible] = useState(false);
  const [adIndex, setAdIndex] = useState(0);

  const ads = useMemo(() => PROMO_ADS, []);
  const currentAd = ads[adIndex] ?? ads[0];

  useEffect(() => {
    if (!shouldShowPromoPopup()) {
      return;
    }

    const initialIndex = nextPromoAdIndex(ads.length);
    setAdIndex(initialIndex);

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [ads.length]);

  const close = (index = adIndex) => {
    dismissPromoPopup(index);
    setVisible(false);
  };

  const goTo = (nextIndex: number) => {
    const wrapped = (nextIndex + ads.length) % ads.length;
    setAdIndex(wrapped);
  };

  if (!visible || !currentAd) {
    return null;
  }

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={t(currentAd.altKey)}
      data-testid="home-ad-popup"
    >
      <div className="relative max-w-3xl w-full bg-white flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {ads.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(adIndex - 1)}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  aria-label={t('home.adPopup.prev')}
                >
                  <PrevIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(adIndex + 1)}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  aria-label={t('home.adPopup.next')}
                >
                  <NextIcon size={18} />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => close()}
            className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer border border-white/20 shadow-lg"
            aria-label={t('home.adPopup.close')}
            title={t('home.adPopup.close')}
          >
            <X size={20} />
          </button>
        </div>

        <Link
          to={currentAd.link}
          className="relative block cursor-pointer group"
          onClick={() => close()}
        >
          <img
            src={currentAd.imageSrc}
            alt={t(currentAd.altKey)}
            className="w-full h-auto max-h-[78vh] object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/35 to-transparent pointer-events-none" />
        </Link>

        {ads.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
            {ads.map((ad, index) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => setAdIndex(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === adIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={t('home.adPopup.goTo', { n: String(index + 1) })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
