import { useEffect, useState } from 'react';
import { Smartphone, Scan, Box } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';

const APP_MOCKUP_SRC = '/diyar-phone-mockup.webp';
const APP_MOCKUP_FALLBACK = '/laptop.webp';

const GOOGLE_PLAY_BADGE_EN =
  'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg';
/** Wikimedia has no stable AR SVG; EN badge is used with localized alt text. */
const GOOGLE_PLAY_BADGE_AR = GOOGLE_PLAY_BADGE_EN;
const APP_STORE_BADGE =
  'https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg';

export function AppPromo() {
  const { t, dir, locale } = useLocale();
  const isRtl = dir === 'rtl';
  const [mockupSrc, setMockupSrc] = useState(APP_MOCKUP_SRC);
  const [googlePlayBadgeSrc, setGooglePlayBadgeSrc] = useState(
    locale === 'ar' ? GOOGLE_PLAY_BADGE_AR : GOOGLE_PLAY_BADGE_EN,
  );

  useEffect(() => {
    setGooglePlayBadgeSrc(locale === 'ar' ? GOOGLE_PLAY_BADGE_AR : GOOGLE_PLAY_BADGE_EN);
  }, [locale]);

  const handleMockupError = () => {
    setMockupSrc((current) => (current === APP_MOCKUP_FALLBACK ? current : APP_MOCKUP_FALLBACK));
  };

  const textOrder = isRtl ? 'md:order-2' : 'md:order-1';
  const headingAlign = isRtl ? 'md:text-end' : 'md:text-start';
  const phonePlacement = isRtl
    ? 'md:order-1 md:justify-end md:pe-1 lg:pe-2'
    : 'md:order-2 md:justify-start md:ps-1 lg:ps-2';

  return (
    <div className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-8 md:pb-12 overflow-visible" dir={dir}>
      <div className="bg-linear-to-br from-diyar-dark to-[#342D25] rounded-3xl relative shadow-md overflow-visible">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-diyar-brown/30 rounded-full mix-blend-color-dodge filter blur-[80px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full mix-blend-color-dodge filter blur-[100px] -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end md:gap-x-8 lg:gap-x-10">
          <div
            dir={dir}
            className={`w-full md:w-[48%] lg:w-[46%] p-6 md:p-10 flex flex-col justify-center shrink-0 ${textOrder}`}
          >
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-diyar-cream mb-6 backdrop-blur-md border border-white/10 self-center ${isRtl ? 'md:self-end' : 'md:self-start'}`}
            >
              <Smartphone size={14} />
              <span className="text-xs font-bold">{t('home.appPromo.badge')}</span>
            </div>

            <h2
              className={`text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight font-sans text-start ${headingAlign}`}
            >
              {t('home.appPromo.titleLine1')}{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-diyar-cream to-amber-300 rtl:bg-linear-to-l">
                {t('home.appPromo.titleLine2')}
              </span>
            </h2>

            <p className="text-base text-white/70 mb-8 leading-relaxed font-medium text-justify">
              {t('home.appPromo.body')}
            </p>

            <div className="hidden lg:grid grid-cols-2 gap-4 mb-8 text-justify">
              <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                  <Box size={16} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold mb-0.5">{t('home.appPromo.arTitle')}</h4>
                  <p className="text-white/60 text-[10px]">{t('home.appPromo.arDesc')}</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                  <Scan size={16} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold mb-0.5">
                    {t('home.appPromo.imageSearchTitle')}
                  </h4>
                  <p className="text-white/60 text-[10px]">{t('home.appPromo.imageSearchDesc')}</p>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-row items-center gap-3 justify-center ${isRtl ? 'md:justify-end' : 'md:justify-start'}`}
            >
              <button type="button" className="transition-transform hover:scale-105 active:scale-95">
                <img
                  src={APP_STORE_BADGE}
                  alt={t('home.appPromo.appStoreAlt')}
                  className="h-10 md:h-12 w-auto"
                />
              </button>
              <button type="button" className="transition-transform hover:scale-105 active:scale-95">
                <img
                  src={googlePlayBadgeSrc}
                  alt={t('home.appPromo.googlePlayAlt')}
                  className="h-10 md:h-12 w-auto"
                  onError={() => setGooglePlayBadgeSrc(GOOGLE_PLAY_BADGE_EN)}
                />
              </button>
            </div>
          </div>

          <div
            className={`w-full md:w-[48%] lg:w-[46%] flex items-end justify-center px-6 pb-4 md:px-4 md:pb-0 md:pt-8 overflow-visible shrink-0 ${phonePlacement}`}
          >
            <div className="translate-y-5 md:translate-y-7 lg:translate-y-9 transition-transform duration-500 ease-out hover:scale-[1.03] md:hover:scale-105 lg:hover:scale-[1.06] will-change-transform origin-bottom">
              <img
                src={mockupSrc}
                alt={t('home.appPromo.mockupAlt')}
                width={400}
                height={800}
                className="animate-diyar-app-phone-float w-[min(68%,225px)] sm:w-52 md:w-60 lg:w-65 h-auto max-h-85 md:max-h-105 object-contain object-bottom origin-bottom scale-120 sm:scale-125 md:scale-135 lg:scale-150 drop-shadow-2xl select-none"
                onError={handleMockupError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
