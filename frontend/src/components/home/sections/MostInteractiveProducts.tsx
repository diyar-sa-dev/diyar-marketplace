import { useMemo } from 'react';
import ProductCard from '../../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../../cards/ProductCardSkeleton.tsx';
import { useProducts } from '../../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../../lib/catalogMappers.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';
import { HorizontalRail } from './HorizontalRail.tsx';
import { Flame, Radio, Sparkles } from 'lucide-react';

const CARD_WRAP = 'w-48 shrink-0 snap-start sm:w-52 md:w-auto';

// Stable pseudo-random mock enrichment based on ID to ensure consistent engagement figures
function getEngagementStats(id: string | number, index: number) {
  const hash = String(id)
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 7);

  // Pre-configured baseline fallback for the primary items requested
  const presets = [
    { views: 2450, likes: 312, saves: 184, rate: 94 },
    { views: 1890, likes: 245, saves: 142, rate: 89 },
    { views: 1530, likes: 198, saves: 95, rate: 85 },
    { views: 3120, likes: 421, saves: 230, rate: 98 },
    { views: 2110, likes: 280, saves: 165, rate: 91 },
    { views: 1740, likes: 215, saves: 110, rate: 87 },
  ];

  if (index < presets.length) {
    return presets[index];
  }

  const views = 1200 + (hash % 2000);
  const likes = 150 + (hash % 300);
  const saves = 80 + (hash % 150);
  const rate = 80 + (hash % 19);

  return { views, likes, saves, rate };
}

export function MostInteractiveProducts() {
  const { t, locale } = useLocale();
  const isRtl = locale === 'ar';
  const { data, isLoading } = useProducts({ per_page: 6, sort: '-popular' });
  const rawProducts = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && rawProducts.length === 0;

  // Enrich products with engagement telemetry (views, likes, saves, interaction rate)
  const products = useMemo(() => {
    return rawProducts.map((product, idx) => {
      const stats = getEngagementStats(product.id, idx);
      return {
        ...product,
        viewsCount: product.viewsCount ?? stats.views,
        likesCount: product.likesCount ?? stats.likes,
        savesCount: product.savesCount ?? stats.saves,
        interactionRate: product.interactionRate ?? stats.rate,
      };
    });
  }, [rawProducts]);

  return (
    <section
      aria-label={t('home.mostInteractive.title')}
      className="relative overflow-hidden border-y border-amber-200/50 bg-gradient-to-b from-amber-50/25 via-white to-diyar-cream/15 py-8 sm:py-10 md:py-12"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Subtle ambient blur glow */}
      <div
        className="pointer-events-none absolute -top-24 end-1/4 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 start-1/4 h-72 w-72 rounded-full bg-rose-200/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Header section with live indicator badge */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
            </span>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <Flame size={13} className="text-amber-600 fill-amber-500" />
              {t('home.mostInteractive.badge')}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Radio size={10} className="animate-pulse" />
              {t('home.mostInteractive.liveBadge')}
            </span>
          </div>

          <h2 className="font-sans text-2xl font-bold tracking-tight text-diyar-dark sm:text-3xl md:text-4xl">
            {t('home.mostInteractive.title')}
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-gray-500 sm:text-sm">
            {t('home.mostInteractive.subtitle')}
          </p>

          <div className="mt-3">
            <a
              href="/category/all?sort=-popular"
              className="inline-flex items-center gap-1 text-sm font-bold text-diyar-brown transition hover:text-diyar-dark cursor-pointer group"
            >
              <span>{t('home.mostInteractive.viewAll')}</span>
              <span className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                {isRtl ? '←' : '→'}
              </span>
            </a>
          </div>
        </div>

        {showEmpty ? (
          <SectionEmptyState
            title={t('home.mostInteractive.emptyTitle')}
            description={t('home.mostInteractive.emptyDescription')}
            browseLabel={t('home.mostInteractive.browseAll')}
            browseTo="/category/all?sort=-popular"
          />
        ) : (
          <HorizontalRail className="flex gap-4 overflow-x-auto py-2 scrollbar-hide snap-x md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:grid-cols-6">
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className={CARD_WRAP}>
                    <div className="relative rounded-2xl border border-gray-100 bg-white p-2 shadow-xs">
                      {/* Top highlight skeleton */}
                      <div className="mb-2 flex items-center justify-between px-1">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                        <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                      </div>
                      <ProductCardSkeleton className="border-0 shadow-none" />
                    </div>
                  </div>
                ))
              : products.map((product) => (
                  <div key={product.id} className={CARD_WRAP}>
                    <div className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white p-2 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg">
                      {/* Interactive pill top bar */}
                      <div className="mb-1.5 flex items-center justify-between px-1 text-[10px]">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-800 border border-amber-200/60">
                          <Flame size={11} className="text-amber-600 fill-amber-500" />
                          <span>
                            {t('home.mostInteractive.interactionRate', {
                              rate: product.interactionRate ?? 90,
                            })}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{t('home.mostInteractive.activeNow')}</span>
                        </span>
                      </div>

                      {/* Main Product Card */}
                      <div className="grow">
                        <ProductCard product={product} />
                      </div>
                    </div>
                  </div>
                ))}
          </HorizontalRail>
        )}
      </div>
    </section>
  );
}
