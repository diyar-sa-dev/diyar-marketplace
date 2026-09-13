import ProductCard from '../../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../../cards/ProductCardSkeleton.tsx';
import { useProducts } from '../../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../../lib/catalogMappers.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';
import { HorizontalRail } from './HorizontalRail.tsx';

const CARD_WRAP = 'w-50 shrink-0 snap-start md:w-57.5';

export function NewArrivals() {
  const { t } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 6, sort: '-created_at' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  return (
    <div className="bg-diyar-cream/30 py-4 md:py-6">
      <div className="mx-auto max-w-7xl px-4">
        <HomeSectionHeader
          title={t('home.newArrivals.title')}
          linkTo="/category/all?sort=-created_at"
          linkLabel={t('home.newArrivals.viewAll')}
        />
        {showEmpty ? (
          <SectionEmptyState
            title={t('home.newArrivals.emptyTitle')}
            description={t('home.newArrivals.emptyDescription')}
            browseLabel={t('home.newArrivals.browseAll')}
            browseTo="/category/all?sort=-created_at"
          />
        ) : (
          <HorizontalRail className="flex gap-4 overflow-x-auto py-2 scrollbar-hide snap-x md:gap-5">
            {isLoading
              ? [...Array(4)].map((_, i) => (
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
    </div>
  );
}
