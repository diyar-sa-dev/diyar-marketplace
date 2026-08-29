import { useState } from 'react';
import { Smartphone, Scan, Box } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';

/** Avoid `/app*.png` — Vite Reverb proxy prefix is `/app/`. */
const APP_MOCKUP_SRC = '/diyar-phone-mockup.png';
const APP_MOCKUP_FALLBACK = '/laptop.png';

export function AppPromo() {
  const { t } = useLocale();
  const [mockupSrc, setMockupSrc] = useState(APP_MOCKUP_SRC);

  const handleMockupError = () => {
    setMockupSrc((current) => {
      if (current === APP_MOCKUP_FALLBACK) {
        return current;
      }
      if (current === APP_MOCKUP_SRC) {
        return '/app-mockup.png';
      }
      return APP_MOCKUP_FALLBACK;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-8 md:pb-12">
      <div className="bg-linear-to-br from-diyar-dark to-[#342D25] rounded-3xl relative flex flex-col md:flex-row items-stretch shadow-md overflow-hidden">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-diyar-brown/30 rounded-full mix-blend-color-dodge filter blur-[80px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full mix-blend-color-dodge filter blur-[100px] -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 relative z-10 text-center md:text-start flex flex-col justify-center">
          <div className="inline-flex self-center md:self-start items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-diyar-cream mb-6 backdrop-blur-md border border-white/10">
            <Smartphone size={14} />
            <span className="text-xs font-bold">{t('home.appPromo.badge')}</span>
          </div>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.4] font-sans">
            {t('home.appPromo.titleLine1')} <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-diyar-cream to-amber-300">
              {t('home.appPromo.titleLine2')}
            </span>
          </h2>

          <p className="text-base text-white/70 mb-8 leading-relaxed font-medium">
            {t('home.appPromo.body')}
          </p>

          <div className="hidden lg:grid grid-cols-2 gap-4 mb-8 text-start">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                <Box size={16} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">{t('home.appPromo.arTitle')}</h4>
                <p className="text-white/60 text-[10px]">{t('home.appPromo.arDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
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

          <div className="flex flex-row items-center justify-center md:justify-start gap-3">
            <button type="button" className="transition-transform hover:scale-105 active:scale-95">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="App Store"
                className="h-10 md:h-12 w-auto"
              />
            </button>
            <button type="button" className="transition-transform hover:scale-105 active:scale-95">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Google Play"
                className="h-10 md:h-12 w-auto"
              />
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative flex justify-center items-end pt-2 pb-0 md:py-0 min-h-64 md:min-h-80">
          <img
            src={mockupSrc}
            alt={t('home.appPromo.mockupAlt')}
            width={420}
            height={840}
            className="relative z-20 w-[min(72%,280px)] sm:w-[min(58%,320px)] md:w-[min(85%,360px)] h-auto max-h-[420px] md:max-h-none md:absolute md:bottom-0 md:start-1/2 md:-translate-x-1/2 object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500"
            onError={handleMockupError}
          />
        </div>
      </div>
    </div>
  );
}
