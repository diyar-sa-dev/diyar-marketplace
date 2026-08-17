import type { ApiSuccessResponse } from './api.ts';

export type CategoryType = 'product' | 'service' | 'both';

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  type: CategoryType;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

export interface ProductVendor {
  store_name: string;
  slug: string;
}

export interface ProductCategoryRef {
  name: string;
  slug: string;
}

export interface ProductInventoryRef {
  available_quantity: number;
  stock_quantity?: number;
  reserved_quantity?: number;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sale_price: string | number;
  compare_price?: string | number | null;
  discount_percent?: number | null;
  availability_mode: 'in_stock' | 'out_of_stock' | 'preorder';
  product_type?: 'single' | 'bundle';
  created_at?: string;
  image_url?: string | null;
  vendor?: ProductVendor;
  category?: ProductCategoryRef & { type?: CategoryType };
  inventory?: ProductInventoryRef;
  user_saved?: boolean;
}

export interface ProductColor {
  name: string;
  hex_code: string;
}

export interface ProductImage {
  id: string;
  url: string | null;
  sort_order: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sale_price: string | number;
  compare_price?: string | number | null;
  product_type: 'single' | 'bundle';
  availability_mode: 'in_stock' | 'out_of_stock' | 'preorder';
  expected_available_at?: string | null;
  status: string;
  dimensions: {
    width: string | number | null;
    height: string | number | null;
    depth: string | number | null;
  };
  materials: Record<string, string> | string[] | null;
  warranty: string | null;
  return_policy?: {
    override_enabled: boolean;
    returnable: boolean | null;
    return_window_days: number | null;
    return_accepted_reasons: string[] | null;
    return_requires_unused: boolean | null;
    return_requires_evidence: boolean | null;
    return_shipping_paid_by: string | null;
    return_shipping_refundable: boolean | null;
  };
  colors?: ProductColor[];
  images?: ProductImage[];
  inventory?: {
    stock_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
  };
  rating_avg: number | null;
  reviews_count: number;
  likes_count: number;
  user_liked?: boolean;
  user_saved?: boolean;
  vendor?: ProductVendor & { id: string };
  category?: ProductCategoryRef & { id: string };
  related_products?: ProductCard[];
}

export interface VendorPublic {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

export interface VendorCard extends VendorPublic {
  product_count?: number;
}

export interface PaginatedVendors {
  items: VendorCard[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedProducts {
  items: ProductCard[];
  pagination: PaginationMeta;
}

export interface ProductListFilters {
  q?: string;
  category_id?: string;
  category_slug?: string;
  vendor_id?: string;
  min_price?: number;
  max_price?: number;
  availability_mode?: 'in_stock' | 'out_of_stock' | 'preorder';
  product_type?: 'single' | 'bundle';
  discounted?: boolean | string;
  sort?: string;
  page?: number;
  per_page?: number;
  status?: string;
}

export type CategoriesResponse = ApiSuccessResponse<{ categories: Category[] }>;
export type CategoryResponse = ApiSuccessResponse<{ category: Category }>;
export type ProductsResponse = ApiSuccessResponse<PaginatedProducts>;
export type ProductDetailResponse = ApiSuccessResponse<{ product: ProductDetail }>;
export type VendorResponse = ApiSuccessResponse<{ vendor: VendorPublic }>;
export type VendorsResponse = ApiSuccessResponse<PaginatedVendors>;
