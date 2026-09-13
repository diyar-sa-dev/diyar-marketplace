import { Store } from 'lucide-react';
import { useVendors } from '../../../hooks/catalog/useCatalog.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { isValidStoreSlug } from '../../../lib/storePath.ts';
import { VerifiedStoresRail } from '../../catalog/VerifiedStoresRail.tsx';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';

export function FeaturedStores() {
  const { t } = useLocale();
  const { data, isLoading } = useVendors({ per_page: 6 });
  const stores = (data?.items ?? []).filter((store) => isValidStoreSlug(store.slug));
  const showEmpty = !isLoading && stores.length === 0;

  return (
    <div className="bg-gray-50 py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <HomeSectionHeader
          badge={t('home.featuredStores.badge')}
          title={t('home.featuredStores.title')}
          linkTo="/category/all"
          linkLabel={t('home.featuredStores.viewAll')}
        />
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 w-32 shrink-0 animate-pulse rounded-2xl bg-white sm:h-40 sm:w-36"
              />
            ))}
          </div>
        ) : showEmpty ? (
          <SectionEmptyState
            title={t('home.featuredStores.emptyTitle')}
            description={t('home.featuredStores.emptyDescription')}
            browseLabel={t('home.featuredStores.browseAll')}
            browseTo="/category/all"
            icon={Store}
          />
        ) : (
          <VerifiedStoresRail vendors={stores} mode="link" />
        )}
      </div>
    </div>
  );
}
