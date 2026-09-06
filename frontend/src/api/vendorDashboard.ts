import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  PaginatedProducts,
  ProductDetail,
  ProductListFilters,
  ProductsResponse,
} from '../types/catalog.ts';

type ProductDetailResponse = ApiSuccessResponse<{ product: ProductDetail }>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

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

export async function fetchVendorProducts(
  filters: ProductListFilters = {},
): Promise<PaginatedProducts> {
  const response = await apiClient.get<ProductsResponse>(
    `/dashboard/vendor/products${buildQuery(filters)}`,
  );
  return response.data.data;
}

export async function fetchVendorProduct(id: string): Promise<ProductDetail> {
  const response = await apiClient.get<ProductDetailResponse>(`/dashboard/vendor/products/${id}`);
  return response.data.data.product;
}

export interface VendorProductPayload {
  category_id: string;
  name: string;
  description?: string | null;
  sale_price: number;
  compare_price?: number | null;
  promotion_ends_at?: string | null;
  stock_quantity: number;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  materials?: string[] | null;
  warranty?: string | null;
  availability_mode?: 'in_stock' | 'out_of_stock' | 'preorder';
  expected_available_at?: string | null;
  colors?: Array<{ name: string; hex_code: string }>;
  return_policy_override_enabled?: boolean;
  returnable?: boolean | null;
  return_window_days?: number | null;
  return_accepted_reasons?: string[] | null;
  return_requires_unused?: boolean | null;
  return_requires_evidence?: boolean | null;
  return_shipping_paid_by?: string | null;
  return_shipping_refundable?: boolean | null;
}

type UploadProgressHandler = (percent: number) => void;

export async function createVendorProduct(
  payload: VendorProductPayload,
  images?: File[],
  onProgress?: UploadProgressHandler,
): Promise<ProductDetail> {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (key === 'colors' && Array.isArray(value)) {
      value.forEach((color, index) => {
        formData.append(`colors[${index}][name]`, color.name);
        formData.append(`colors[${index}][hex_code]`, color.hex_code);
      });
      return;
    }
    if (key === 'materials' && Array.isArray(value)) {
      value.forEach((material, index) => {
        formData.append(`materials[${index}]`, material);
      });
      return;
    }
    formData.append(key, String(value));
  });
  images?.forEach((file) => formData.append('images[]', file));

  const response = await withCsrf(() =>
    apiClient.post<ProductDetailResponse>('/dashboard/vendor/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded * 100) / event.total));
        }
      },
    }),
  );
  return response.data.data.product;
}

export async function updateVendorProduct(
  id: string,
  payload: Partial<VendorProductPayload>,
): Promise<ProductDetail> {
  const response = await withCsrf(() =>
    apiClient.patch<ProductDetailResponse>(`/dashboard/vendor/products/${id}`, payload),
  );
  return response.data.data.product;
}

export async function archiveVendorProduct(id: string): Promise<void> {
  await withCsrf(() => apiClient.delete(`/dashboard/vendor/products/${id}`));
}

export async function adjustVendorInventory(
  productId: string,
  payload: { type: 'increase' | 'decrease' | 'adjustment'; quantity: number; note?: string },
): Promise<ProductDetail> {
  const response = await withCsrf(() =>
    apiClient.patch<ProductDetailResponse>(`/dashboard/vendor/inventory/${productId}`, payload),
  );
  return response.data.data.product;
}

export async function uploadVendorProductImages(
  productId: string,
  images: File[],
  onProgress?: UploadProgressHandler,
): Promise<ProductDetail> {
  const formData = new FormData();
  images.forEach((file) => formData.append('images[]', file));

  const response = await withCsrf(() =>
    apiClient.post<ProductDetailResponse>(
      `/dashboard/vendor/products/${productId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded * 100) / event.total));
          }
        },
      },
    ),
  );
  return response.data.data.product;
}

export async function deleteVendorProductImage(productId: string, imageId: string): Promise<void> {
  await withCsrf(() =>
    apiClient.delete(`/dashboard/vendor/products/${productId}/images/${imageId}`),
  );
}
