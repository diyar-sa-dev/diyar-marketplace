import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../api/catalog.ts';
import { useCategories } from '../catalog/useCatalog.ts';
import { useServiceCategories, useServices } from '../services/useServices.ts';

const CACHE_KEY = ['assistant-catalog-context'] as const;

function buildCatalogContext(
  productCategories: Array<{
    name: string;
    slug: string;
    children?: Array<{ name: string; slug: string }>;
  }>,
  products: Array<{
    name: string;
    sale_price?: string | number;
    category?: { name?: string };
    vendor?: { store_name?: string };
  }>,
  services: Array<{
    title: string;
    starting_price?: number | null;
    pricing_label?: string | null;
    category?: { name?: string };
  }>,
  serviceCategories: Array<{ name_ar: string; name_en: string; slug: string }>,
  locale: 'ar' | 'en',
): string {
  const categoryLines = productCategories
    .slice(0, 12)
    .map((category) => {
      const children = (category.children ?? [])
        .slice(0, 6)
        .map((child) => child.name)
        .join(', ');
      return `- ${category.name} (${category.slug})${children ? `: ${children}` : ''}`;
    })
    .join('\n');

  const productLines = products
    .slice(0, 40)
    .map(
      (product) =>
        `- ${product.name} | ${product.sale_price ?? '—'} SAR | ${product.category?.name ?? '—'} | ${product.vendor?.store_name ?? '—'}`,
    )
    .join('\n');

  const serviceCategoryLines = serviceCategories
    .slice(0, 10)
    .map(
      (category) => `- ${locale === 'ar' ? category.name_ar : category.name_en} (${category.slug})`,
    )
    .join('\n');

  const serviceLines = services
    .slice(0, 20)
    .map(
      (service) =>
        `- ${service.title} | ${service.pricing_label ?? service.starting_price ?? '—'} | ${service.category?.name ?? '—'}`,
    )
    .join('\n');

  return [
    'PRODUCT CATEGORIES:',
    categoryLines || '- (none)',
    '',
    'SAMPLE PRODUCTS:',
    productLines || '- (none)',
    '',
    'SERVICE CATEGORIES:',
    serviceCategoryLines || '- (none)',
    '',
    'SAMPLE SERVICES:',
    serviceLines || '- (none)',
  ].join('\n');
}

export function useAssistantCatalogContext(locale: 'ar' | 'en' = 'ar') {
  const categoriesQuery = useCategories('product');
  const serviceCategoriesQuery = useServiceCategories();
  const servicesQuery = useServices({ per_page: 20, page: 1 });

  const productsQuery = useQuery({
    queryKey: [...CACHE_KEY, 'products'],
    queryFn: () => fetchProducts({ per_page: 40, page: 1, sort: '-popular' }),
    staleTime: 1000 * 60 * 30,
  });

  const catalogContext = useMemo(() => {
    return buildCatalogContext(
      categoriesQuery.data ?? [],
      productsQuery.data?.items ?? [],
      servicesQuery.data?.items ?? [],
      serviceCategoriesQuery.data ?? [],
      locale,
    );
  }, [
    categoriesQuery.data,
    productsQuery.data?.items,
    servicesQuery.data?.items,
    serviceCategoriesQuery.data,
    locale,
  ]);

  const isLoading =
    categoriesQuery.isLoading ||
    productsQuery.isLoading ||
    servicesQuery.isLoading ||
    serviceCategoriesQuery.isLoading;

  return { catalogContext, isLoading };
}
