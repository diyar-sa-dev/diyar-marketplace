import ProductCard from '../../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../../cards/ProductCardSkeleton.tsx';
import { useProducts } from '../../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../../lib/catalogMappers.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';
import { HorizontalRail } from './HorizontalRail.tsx';

const CARD_WRAP = 'w-44 shrink-0 snap-start sm:w-48 md:w-auto';

export function MostInteractiveProducts() {
  const { t } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 6, sort: '-popular' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  return (
    <div className="border-t border-b border-gray-100/10 bg-linear-to-b from-white to-diyar-cream/10 py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <HomeSectionHeader
          title={t('home.mostInteractive.title')}
          subtitle={t('home.mostInteractive.subtitle')}
          linkTo="/category/all?sort=-popular"
          linkLabel={t('home.mostInteractive.viewAll')}
        />
        {showEmpty ? (
          <SectionEmptyState
            title={t('home.mostInteractive.emptyTitle')}
            description={t('home.mostInteractive.emptyDescription')}
            browseLabel={t('home.mostInteractive.browseAll')}
            browseTo="/category/all?sort=-popular"
          />
        ) : (
          <HorizontalRail className="flex gap-4 overflow-x-auto py-2 scrollbar-hide snap-x md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-6">
            {isLoading
              ? [...Array(6)].map((_, i) => (
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
