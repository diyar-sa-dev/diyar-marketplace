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
  id?: string;
  store_name: string;
  slug: string;
  rating_avg?: number | null;
  reviews_count?: number;
  product_count?: number | null;
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
  rating_avg?: number | null;
  reviews_count?: number;
  user_saved?: boolean;
  is_own_store?: boolean;
  /** Server-computed estimate from admin loyalty rules */
  loyalty_points_estimate?: number;
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
  user_preorder_pending?: boolean;
  is_own_store?: boolean;
  vendor?: ProductVendor & { id: string };
  category?: ProductCategoryRef & { id: string };
  related_products?: ProductCard[];
  sales_stats?: {
    orders_count: number;
    total_revenue: string;
    return_rate: number;
  };
}

export interface VendorPublic {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  location: string | null;
  support_phone?: string | null;
  support_email?: string | null;
  website_url?: string | null;
  logo_url: string | null;
  cover_url: string | null;
  rating_avg?: number | null;
  reviews_count?: number;
  products_count?: number;
  followers_count?: number;
  is_following?: boolean;
  is_own_store?: boolean;
  working_hours?: Array<{
    day: string;
    label: string;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
    closes_next_day?: boolean;
  }>;
  return_policy_summary?: string[];
  shipping_summary?: string[];
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
