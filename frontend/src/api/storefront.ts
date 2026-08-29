import { apiClient } from './client.ts';
import type { PaginatedBlogArticles } from '../types/blog.ts';
import type { PaginatedProducts, PaginatedVendors } from '../types/catalog.ts';
import type { PaginatedServices } from '../types/services.ts';

export type HomeStorefrontCategory = {
  id: string;
  slug: string;
  name: string;
  type?: string;
  children?: HomeStorefrontCategory[];
};

export type HomeServicesByCategory = {
  category: HomeStorefrontCategory;
  items: PaginatedServices['items'];
};

export type HomeStorefrontSections = {
  product_categories: { categories: HomeStorefrontCategory[] };
  service_categories: { categories: HomeStorefrontCategory[] };
  most_interactive_products: PaginatedProducts;
  featured_deals: PaginatedProducts & { ends_at?: string | null };
  new_arrivals: PaginatedProducts;
  best_sellers: PaginatedProducts;
  suggested_for_you: PaginatedProducts;
  featured_vendors: PaginatedVendors;
  services_by_category: HomeServicesByCategory[];
  blog_articles: PaginatedBlogArticles;
};

type HomeStorefrontResponse = {
  success: boolean;
  data: { sections: HomeStorefrontSections };
};

export async function fetchHomeStorefront(): Promise<HomeStorefrontSections> {
  const response = await apiClient.get<HomeStorefrontResponse>('/storefront/home');
  return response.data.data.sections;
}
