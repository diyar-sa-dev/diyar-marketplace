import type { ApiSuccessResponse } from './api.ts';
import type { ProductCard } from './catalog.ts';
import type { ServiceCard } from './services.ts';

export type CatalogSearchType = 'all' | 'products' | 'services';

export type CatalogSearchSort =
  | '-created_at'
  | 'created_at'
  | 'price'
  | '-price'
  | 'name'
  | '-name'
  | '-discount'
  | 'discount'
  | '-popular'
  | 'popular'
  | 'latest'
  | 'rating';

export interface CatalogSearchFilters {
  q?: string;
  type?: CatalogSearchType;
  category_slug?: string;
  vendor_id?: string;
  vendor_slug?: string;
  min_price?: number;
  max_price?: number;
  color?: string;
  colors?: string[];
  material?: string;
  availability_mode?: 'in_stock' | 'out_of_stock' | 'preorder';
  discounted?: boolean | 0 | 1;
  sort?: CatalogSearchSort;
  page?: number;
  per_page?: number;
}

export interface CatalogSearchVendorFacet {
  id: string;
  store_name: string;
  slug: string;
  product_count: number;
}

export interface CatalogSearchCategoryFacet {
  slug: string;
  name: string;
  type: string;
}

export interface CatalogSearchColorFacet {
  name: string;
  hex_code: string | null;
}

export interface CatalogSearchFacets {
  vendors: CatalogSearchVendorFacet[];
  categories: CatalogSearchCategoryFacet[];
  colors: CatalogSearchColorFacet[];
}

export interface CatalogSearchPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CatalogSearchResultSection<T> {
  items: T[];
  pagination: CatalogSearchPagination;
}

export interface CatalogSearchResult {
  type: CatalogSearchType;
  query: string | null;
  facets: CatalogSearchFacets;
  products?: CatalogSearchResultSection<ProductCard>;
  services?: CatalogSearchResultSection<ServiceCard>;
}

export type CatalogSearchResponse = ApiSuccessResponse<CatalogSearchResult>;
