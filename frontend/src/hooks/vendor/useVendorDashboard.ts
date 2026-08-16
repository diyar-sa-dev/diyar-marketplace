import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vendorApi from '../../api/vendorDashboard.ts';
import type { ProductListFilters } from '../../types/catalog.ts';
import { categoryKeys, productKeys } from '../catalog/queryKeys.ts';

export const vendorDashboardKeys = {
  all: ['vendor-dashboard'] as const,
  products: (filters: ProductListFilters = {}) =>
    [...vendorDashboardKeys.all, 'products', filters] as const,
  product: (id: string) => [...vendorDashboardKeys.all, 'product', id] as const,
};

export function useVendorDashboardProducts(filters: ProductListFilters = {}) {
  return useQuery({
    queryKey: vendorDashboardKeys.products(filters),
    queryFn: () => vendorApi.fetchVendorProducts(filters),
  });
}

export function useVendorDashboardProduct(id: string | undefined) {
  return useQuery({
    queryKey: vendorDashboardKeys.product(id ?? ''),
    queryFn: () => vendorApi.fetchVendorProduct(id!),
    enabled: Boolean(id),
  });
}

export function useVendorProductMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.all });
    queryClient.invalidateQueries({ queryKey: productKeys.all });
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  };

  const create = useMutation({
    mutationFn: ({
      payload,
      images,
      onProgress,
    }: {
      payload: vendorApi.VendorProductPayload;
      images?: File[];
      onProgress?: (percent: number) => void;
    }) => vendorApi.createVendorProduct(payload, images, onProgress),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<vendorApi.VendorProductPayload>;
    }) => vendorApi.updateVendorProduct(id, payload),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => vendorApi.archiveVendorProduct(id),
    onSuccess: invalidate,
  });

  const adjustInventory = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { type: 'increase' | 'decrease' | 'adjustment'; quantity: number; note?: string };
    }) => vendorApi.adjustVendorInventory(id, payload),
    onSuccess: invalidate,
  });

  const uploadImages = useMutation({
    mutationFn: ({
      id,
      images,
      onProgress,
    }: {
      id: string;
      images: File[];
      onProgress?: (percent: number) => void;
    }) => vendorApi.uploadVendorProductImages(id, images, onProgress),
    onSuccess: invalidate,
  });

  const deleteImage = useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      vendorApi.deleteVendorProductImage(productId, imageId),
    onSuccess: invalidate,
  });

  return { create, update, archive, adjustInventory, uploadImages, deleteImage };
}
