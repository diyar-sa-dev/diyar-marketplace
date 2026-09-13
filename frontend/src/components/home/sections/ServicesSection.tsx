import { Link } from 'react-router-dom';
import { Paintbrush } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import ServiceCard from '../../cards/ServiceCard.tsx';
import { serviceKeys } from '../../../hooks/services/queryKeys.ts';
import { fetchServices } from '../../../api/services.ts';
import { useServiceCategories } from '../../../hooks/services/useServices.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { resolveCategoryImageUrl } from '../../../lib/homeCategoryAssets.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { HomeSectionHeader } from '../HomeSectionHeader.tsx';
import { HorizontalRail } from './HorizontalRail.tsx';

const CATEGORY_CARD =
  'flex h-full w-[min(100%,16.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-56';

export function ServicesSection() {
  const { t, locale } = useLocale();
  const { data: serviceCategories = [], isLoading } = useServiceCategories();
  const featuredCategories = serviceCategories.slice(0, 6);
  const showEmpty = !isLoading && serviceCategories.length === 0;

  const categoryLabel = (nameAr: string, nameEn: string) => (locale === 'ar' ? nameAr : nameEn);

  const categoryServiceQueries = useQueries({
    queries: featuredCategories.map((category) => ({
      queryKey: serviceKeys.list({ category: category.slug, per_page: 3, sort: 'latest' }),
      queryFn: () => fetchServices({ category: category.slug, per_page: 3, sort: 'latest' }),
      enabled: Boolean(category.slug),
    })),
  });

  return (
    <div className="border-b border-gray-100 bg-gray-50 py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <HomeSectionHeader
          badge={t('home.diyarServices.badge')}
          badgeClassName="text-purple-600 font-bold"
          title={t('home.diyarServices.title')}
          linkTo="/services"
          linkLabel={t('home.diyarServices.viewAll')}
        />

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${CATEGORY_CARD} h-48 animate-pulse bg-white`} />
            ))}
          </div>
        ) : showEmpty ? (
          <SectionEmptyState
            title={t('home.diyarServices.emptyTitle')}
            description={t('home.diyarServices.emptyDescription')}
            browseLabel={t('home.diyarServices.browseAll')}
            browseTo="/services"
            icon={Paintbrush}
          />
        ) : (
          <HorizontalRail className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x">
            {serviceCategories.map((category) => {
              const imageUrl =
                resolveCategoryImageUrl(category.slug, category.image_url, 'service') ??
                '/logo_diyar.svg';
              const label = categoryLabel(category.name_ar, category.name_en);

              return (
                <Link
                  to={`/services?category=${encodeURIComponent(category.slug)}`}
                  key={category.id}
                  className={`${CATEGORY_CARD} group cursor-pointer`}
                >
                  <div className="relative h-32 shrink-0 overflow-hidden bg-diyar-brown/10 sm:h-36">
                    <img
                      src={imageUrl}
                      alt={label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-center p-3 sm:p-4">
                    <h3
                      className="truncate text-sm font-bold text-diyar-dark sm:text-base"
                      title={label}
                    >
                      {label}
                    </h3>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {t('home.diyarServices.browseCategory')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </HorizontalRail>
        )}

        {!showEmpty &&
          featuredCategories.map((category, index) => {
            const items = categoryServiceQueries[index]?.data?.items ?? [];
            if (items.length === 0) {
              return null;
            }

            const label = categoryLabel(category.name_ar, category.name_en);

            return (
              <div key={category.id} className="mt-10 md:mt-12">
                <HomeSectionHeader
                  title={label}
                  linkTo={`/services?category=${encodeURIComponent(category.slug)}`}
                  linkLabel={t('home.diyarServices.viewAllCategory')}
                  className="mb-4 md:mb-6"
                />
                <HorizontalRail className="flex gap-4 overflow-x-auto py-2 scrollbar-hide snap-x md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
                  {items.map((service) => (
                    <div
                      key={service.id}
                      className="w-full min-w-[16rem] shrink-0 snap-start md:min-w-0"
                    >
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </HorizontalRail>
              </div>
            );
          })}
      </div>
    </div>
  );
}
