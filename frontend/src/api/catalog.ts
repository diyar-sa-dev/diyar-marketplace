import { apiClient } from './client.ts';
import type {
  CategoriesResponse,
  CategoryResponse,
  PaginatedProducts,
  PaginatedVendors,
  ProductDetail,
  ProductDetailResponse,
  ProductListFilters,
  ProductsResponse,
  VendorPublic,
  VendorResponse,
  VendorsResponse,
} from '../types/catalog.ts';

function buildQuery(filters: ProductListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchCategories(type?: 'product' | 'service') {
  const query = type ? `?type=${type}` : '';
  const response = await apiClient.get<CategoriesResponse>(`/categories${query}`);
  return response.data.data.categories;
}

export async function fetchCategory(slug: string) {
  const response = await apiClient.get<CategoryResponse>(`/categories/${slug}`);
  return response.data.data.category;
}

export async function fetchCategoryProducts(
  slug: string,
  filters: ProductListFilters = {},
): Promise<PaginatedProducts> {
  const response = await apiClient.get<ProductsResponse>(
    `/categories/${slug}/items${buildQuery(filters)}`,
  );
  return response.data.data;
}

export async function fetchProducts(filters: ProductListFilters = {}): Promise<PaginatedProducts> {
  const response = await apiClient.get<ProductsResponse>(`/products${buildQuery(filters)}`);
  return response.data.data;
}

export async function searchProducts(filters: ProductListFilters = {}): Promise<PaginatedProducts> {
  const response = await apiClient.get<ProductsResponse>(`/search${buildQuery(filters)}`);
  return response.data.data;
}

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const response = await apiClient.get<ProductDetailResponse>(`/products/${id}`);
  return response.data.data.product;
}

export async function fetchVendor(slug: string): Promise<VendorPublic> {
  const response = await apiClient.get<VendorResponse>(`/vendors/${slug}`);
  return response.data.data.vendor;
}

export async function fetchVendorProducts(
  slug: string,
  filters: ProductListFilters = {},
): Promise<PaginatedProducts> {
  const response = await apiClient.get<ProductsResponse>(
    `/vendors/${slug}/products${buildQuery(filters)}`,
  );
  return response.data.data;
}

export async function fetchVendors(filters: ProductListFilters = {}): Promise<PaginatedVendors> {
  const response = await apiClient.get<VendorsResponse>(`/vendors${buildQuery(filters)}`);
  return response.data.data;
}
