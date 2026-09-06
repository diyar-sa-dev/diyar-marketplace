import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchHomeStorefront, type HomeStorefrontSections } from '../../api/storefront.ts';
import { blogKeys } from '../blog/queryKeys.ts';
import { categoryKeys, productKeys, vendorKeys } from '../catalog/queryKeys.ts';
import { serviceKeys } from '../services/queryKeys.ts';

export const homeStorefrontKeys = {
  all: ['storefront', 'home'] as const,
};

export function hydrateHomeStorefrontCache(
  queryClient: ReturnType<typeof useQueryClient>,
  sections: HomeStorefrontSections,
): void {
  queryClient.setQueryData(
    [...categoryKeys.list(), 'product'],
    sections.product_categories.categories,
  );
  queryClient.setQueryData(
    [...categoryKeys.list(), 'service'],
    sections.service_categories.categories,
  );

  queryClient.setQueryData(
    productKeys.list({ per_page: 6, sort: '-popular' }),
    sections.most_interactive_products,
  );
  queryClient.setQueryData(
    productKeys.list({ per_page: 5, discounted: true, sort: '-discount' }),
    sections.featured_deals,
  );
  queryClient.setQueryData(
    productKeys.list({ per_page: 6, sort: '-created_at' }),
    sections.new_arrivals,
  );
  queryClient.setQueryData(
    productKeys.list({ per_page: 8, sort: '-popular' }),
    sections.best_sellers,
  );
  queryClient.setQueryData(
    productKeys.list({ per_page: 5, sort: '-popular' }),
    sections.suggested_for_you,
  );
  queryClient.setQueryData(vendorKeys.list({ per_page: 6 }), sections.featured_vendors);
  queryClient.setQueryData(blogKeys.articles({ per_page: 3 }), sections.blog_articles);

  for (const block of sections.services_by_category) {
    const slug = block.category.slug;
    if (!slug) {
      continue;
    }
    queryClient.setQueryData(serviceKeys.list({ category: slug, per_page: 3, sort: 'latest' }), {
      items: block.items,
      pagination: { current_page: 1, last_page: 1, per_page: 3, total: block.items.length },
    });
  }
}

export function useHydrateHomeStorefront() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: homeStorefrontKeys.all,
    queryFn: fetchHomeStorefront,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      hydrateHomeStorefrontCache(queryClient, query.data);
    }
  }, [query.data, queryClient]);

  return query;
}
