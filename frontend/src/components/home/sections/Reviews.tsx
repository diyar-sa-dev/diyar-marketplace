import { Quote, Star } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';
import { HorizontalRail } from './HorizontalRail.tsx';

export function Reviews() {
  const { t } = useLocale();
  const reviews = [
    {
      nameKey: 'home.reviews.review1Name',
      textKey: 'home.reviews.review1Text',
      productKey: 'home.reviews.review1Product',
    },
    {
      nameKey: 'home.reviews.review2Name',
      textKey: 'home.reviews.review2Text',
      productKey: 'home.reviews.review2Product',
    },
    {
      nameKey: 'home.reviews.review3Name',
      textKey: 'home.reviews.review3Text',
      productKey: 'home.reviews.review3Product',
    },
  ] as const;

  return (
    <div className="bg-diyar-cream/50 py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <HomeSectionHeader title={t('home.reviews.title')} />
        <HorizontalRail className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="relative flex w-[calc(100vw-2rem)] min-h-[15rem] shrink-0 snap-center flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:w-[min(100%,20rem)] md:min-h-[16.5rem] md:w-auto md:p-8"
            >
              <Quote
                className="absolute top-5 inset-e-5 z-0 size-8 text-diyar-cream opacity-50 md:size-12"
                aria-hidden
              />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-3 flex gap-1 text-yellow-500 md:mb-4">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star key={starIndex} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-700 line-clamp-6 md:mb-6 md:text-base md:line-clamp-none">
                  &ldquo;{t(review.textKey)}&rdquo;
                </p>
                <div className="mt-auto border-t border-gray-100 pt-3 md:pt-4">
                  <p className="truncate text-sm font-bold text-diyar-dark md:text-base">
                    {t(review.nameKey)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400 md:text-sm">
                    {t('home.reviews.purchased', { product: t(review.productKey) })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </HorizontalRail>
      </div>
    </div>
  );
}
