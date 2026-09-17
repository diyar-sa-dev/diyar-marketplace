import { Sparkles, Star } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';
import { HorizontalRail } from './HorizontalRail.tsx';

export function WhyChooseDiyar() {
  const { t } = useLocale();
  const features = [
    {
      titleKey: 'home.whyChoose.unlimitedTitle',
      descKey: 'home.whyChoose.unlimitedDesc',
      icon: 'star',
    },
    { titleKey: 'home.whyChoose.arTitle', descKey: 'home.whyChoose.arDesc', icon: 'sparkles' },
    {
      titleKey: 'home.whyChoose.shippingTitle',
      descKey: 'home.whyChoose.shippingDesc',
      icon: 'truck',
    },
    {
      titleKey: 'home.whyChoose.paymentTitle',
      descKey: 'home.whyChoose.paymentDesc',
      icon: 'lock',
    },
  ] as const;

  return (
    <div className="border-b border-gray-100 py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <HorizontalRail
          controlsClassName="mb-3 md:mb-4"
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0"
        >
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className="flex w-[calc(100vw-2rem)] max-w-none shrink-0 snap-center flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center sm:w-[min(100%,20rem)] md:w-auto md:max-w-none md:rounded-none md:border-none md:bg-transparent md:p-0"
            >
              <div
                className={`mb-4 flex size-14 items-center justify-center rounded-xl bg-white text-diyar-brown shadow-sm md:mb-6 md:size-16 md:bg-diyar-cream md:shadow-none ${
                  index % 2 === 0 ? 'rotate-3' : '-rotate-3'
                }`}
              >
                {feature.icon === 'star' && <Star size={28} />}
                {feature.icon === 'sparkles' && <Sparkles size={28} />}
                {feature.icon === 'truck' && (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                )}
                {feature.icon === 'lock' && (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>
              <h3 className="mb-2 line-clamp-2 text-base font-bold text-diyar-dark md:mb-3 md:text-lg">
                {t(feature.titleKey)}
              </h3>
              <p className="line-clamp-4 text-sm leading-relaxed text-gray-500 md:line-clamp-none md:text-base">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </HorizontalRail>
      </div>
    </div>
  );
}
