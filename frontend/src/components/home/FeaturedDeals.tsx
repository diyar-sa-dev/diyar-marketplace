import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import ProductCard from '../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../cards/ProductCardSkeleton.tsx';
import SectionEmptyState from './SectionEmptyState.tsx';
import { HomeSectionHeader } from './HomeSectionHeader.tsx';
import { HorizontalRail } from './sections/HorizontalRail.tsx';
import { useProducts } from '../../hooks/catalog/useCatalog.ts';
import {
  earliestPromotionEndsAt,
  formatPromotionRemaining,
  usePromotionCountdown,
} from '../../hooks/usePromotionCountdown.ts';
import { mapProductCard } from '../../lib/catalogMappers.ts';
import { useLocale } from '../../hooks/useLocale.ts';

const CARD_WRAP = 'w-44 shrink-0 snap-start sm:w-48 md:w-auto';

export default function FeaturedDeals() {
  const { t } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 5, discounted: true, sort: '-discount' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  const promotionEndsAt = useMemo(
    () => earliestPromotionEndsAt(data?.items.map((product) => product.promotion_ends_at) ?? []),
    [data?.items],
  );
  const secondsLeft = usePromotionCountdown(promotionEndsAt);
  const countdown =
    secondsLeft !== null && secondsLeft > 0 ? formatPromotionRemaining(secondsLeft, t) : null;
  const showCountdown = !showEmpty && countdown !== null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <HomeSectionHeader
        title={t('home.featuredDeals.title')}
        linkTo="/category/all?discounted=1&sort=-discount"
        linkLabel={t('home.featuredDeals.viewAll')}
        extra={
          showCountdown && countdown ? (
            <div
              className="rounded-xl bg-diyar-cream px-4 py-2 text-sm font-bold tabular-nums text-diyar-brown md:text-base"
              dir={countdown.isClock ? 'ltr' : undefined}
              aria-live="polite"
              aria-label={t('home.featuredDeals.countdownLabel')}
              title={t('home.featuredDeals.countdownHint')}
            >
              {countdown.label}
            </div>
          ) : undefined
        }
      />
      {showEmpty ? (
        <SectionEmptyState
          title={t('home.featuredDeals.emptyTitle')}
          description={t('home.featuredDeals.emptyDescription')}
          browseLabel={t('home.featuredDeals.browseAll')}
          browseTo="/category/all?discounted=1&sort=-discount"
          icon={Tag}
        />
      ) : (
        <HorizontalRail className="flex gap-4 overflow-x-auto py-2 scrollbar-hide snap-x md:grid md:grid-cols-5 md:gap-5 md:overflow-visible">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className={CARD_WRAP}>
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className={CARD_WRAP}>
                  <ProductCard product={product} />
                </div>
              ))}
        </HorizontalRail>
      )}
    </div>
  );
}
