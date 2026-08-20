import React, { useMemo, useState } from 'react';
import { useCategories } from '../../hooks/catalog/useCatalog.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import {
  useVendorDashboardProduct,
  useVendorDashboardProducts,
  useVendorProductMutations,
} from '../../hooks/vendor/useVendorDashboard.ts';
import { useVendorAccess } from '../../hooks/vendor/useVendorTeam.ts';
import { vendorCanWrite } from '../../api/vendorTeam.ts';
import { VendorProductsToolbar } from '../../components/dashboard/vendor/VendorProductsToolbar.tsx';
import {
  VendorProductsTable,
  mapToVendorProductRow,
} from '../../components/dashboard/vendor/VendorProductsTable.tsx';
import { VendorProductsGrid } from '../../components/dashboard/vendor/VendorProductsGrid.tsx';
import { VendorProductDetailPanel } from '../../components/dashboard/vendor/VendorProductDetailPanel.tsx';
import {
  VendorProductFormModal,
  type VendorProductFormSubmit,
} from '../../components/dashboard/vendor/VendorProductFormModal.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import {
  confirmArchiveProduct,
  confirmDeleteImage,
  showApiErrorAlert,
  showErrorAlert,
  showSuccessToast,
} from '../../lib/confirmDialog.ts';

export default function VendorProducts() {
  const { t, dir, locale } = useLocale();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const { data: categories } = useCategories('product');

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      category_id: categoryFilter,
      availability_mode:
        stockFilter === 'all'
          ? undefined
          : stockFilter === 'in_stock'
            ? ('in_stock' as const)
            : ('out_of_stock' as const),
      page,
      per_page: perPage,
    }),
    [debouncedSearch, categoryFilter, stockFilter, page, perPage],
  );

  const { data, isLoading, isError, error, refetch } = useVendorDashboardProducts(filters);
  const editProductId = isModalOpen ? editingId : null;
  const { data: editingProduct, isLoading: editingLoading } = useVendorDashboardProduct(
    editProductId ?? undefined,
  );
  const {
    data: selectedProduct,
    isLoading: selectedLoading,
    isError: selectedError,
    error: selectedErr,
    refetch: refetchSelected,
  } = useVendorDashboardProduct(selectedProductId ?? undefined);

  const { create, update, archive, adjustInventory, uploadImages, deleteImage } =
    useVendorProductMutations();
  const { data: vendorAccess } = useVendorAccess();
  const canEditProducts = vendorCanWrite(vendorAccess?.permissions.products);
  const canDeleteProducts = vendorAccess?.permissions.products_delete === true;

  const rows = (data?.items ?? []).map(mapToVendorProductRow);
  const pagination = data?.pagination;
  const isSaving =
    create.isPending || update.isPending || uploadImages.isPending || adjustInventory.isPending;

  const openCreate = () => {
    setEditingId(null);
    setUploadProgress(null);
    setUploadComplete(false);
    setIsModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setUploadProgress(null);
    setUploadComplete(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUploadProgress(null);
    setUploadComplete(false);
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!editingId) {
      return;
    }
    const confirmed = await confirmDeleteImage(t);
    if (!confirmed) {
      return;
    }
    setDeletingImageId(imageId);
    try {
      await deleteImage.mutateAsync({ productId: editingId, imageId });
    } catch {
      await showErrorAlert(t, 'vendor.dialog.deleteImageError', 'vendor.dialog.archiveErrorHint');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleArchive = async (id: string, productName?: string) => {
    const confirmed = await confirmArchiveProduct(t, productName);
    if (!confirmed) {
      return;
    }
    try {
      await archive.mutateAsync(id);
      if (selectedProductId === id) {
        setSelectedProductId(null);
      }
      await showSuccessToast(t, 'vendor.dialog.archiveSuccess');
    } catch {
      await showErrorAlert(t, 'vendor.dialog.archiveError', 'vendor.dialog.archiveErrorHint');
    }
  };

  const handleFormSubmit = async ({ payload, stockAdjust, images }: VendorProductFormSubmit) => {
    setUploadProgress(null);
    setUploadComplete(false);
    try {
      if (editingId) {
        const { stock_quantity: _stock, ...updatePayload } = payload;
        await update.mutateAsync({ id: editingId, payload: updatePayload });

        if (stockAdjust !== undefined) {
          await adjustInventory.mutateAsync({
            id: editingId,
            payload: { type: 'adjustment', quantity: stockAdjust },
          });
        }

        if (images.length > 0) {
          setUploadProgress(0);
          await uploadImages.mutateAsync({
            id: editingId,
            images,
            onProgress: setUploadProgress,
          });
          setUploadProgress(100);
          setUploadComplete(true);
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      } else {
        setUploadProgress(images.length > 0 ? 0 : null);
        await create.mutateAsync({
          payload: { ...payload, stock_quantity: payload.stock_quantity },
          images: images.length > 0 ? images : undefined,
          onProgress: images.length > 0 ? setUploadProgress : undefined,
        });
        if (images.length > 0) {
          setUploadProgress(100);
          setUploadComplete(true);
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }
      closeModal();
    } catch (error) {
      setUploadProgress(null);
      setUploadComplete(false);
      await showApiErrorAlert(t, error, locale);
    }
  };

  const modalProps = {
    open: isModalOpen,
    editingId,
    categories: categories ?? [],
    productDetail: editingProduct,
    detailLoading: Boolean(editingId) && editingLoading,
    isSaving,
    uploadProgress,
    uploadComplete,
    deletingImageId,
    onClose: closeModal,
    onSubmit: handleFormSubmit,
    onDeleteExistingImage: editingId ? handleDeleteExistingImage : undefined,
  };

  if (selectedProductId) {
    return (
      <div className="space-y-6" dir={dir}>
        <VendorProductDetailPanel
          product={selectedProduct}
          isLoading={selectedLoading}
          isError={selectedError}
          error={selectedErr as Error | null}
          onRetry={() => refetchSelected()}
          onBack={() => setSelectedProductId(null)}
          onEdit={() => openEdit(selectedProductId)}
          onArchive={() => handleArchive(selectedProductId, selectedProduct?.name)}
          canEdit={canEditProducts}
          canDelete={canDeleteProducts}
        />
        <VendorProductFormModal {...modalProps} />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <VendorProductsToolbar
        searchTerm={searchInput}
        onSearchChange={(value) => {
          setSearchInput(value);
          resetPage();
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen((open) => !open)}
        onAddProduct={openCreate}
        canAddProduct={canEditProducts}
        categories={categories ?? []}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(id) => {
          setCategoryFilter(id);
          resetPage();
          setIsFilterOpen(false);
        }}
        stockFilter={stockFilter}
        onStockFilterChange={(value) => {
          setStockFilter(value);
          resetPage();
          setIsFilterOpen(false);
        }}
      />

      {isLoading ? (
        <TableSkeleton rows={6} columns={5} className="min-h-60" />
      ) : isError ? (
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      ) : viewMode === 'list' ? (
        <VendorProductsTable
          products={rows}
          onView={setSelectedProductId}
          onEdit={openEdit}
          onArchive={(id) => {
            const row = rows.find((item) => item.id === id);
            void handleArchive(id, row?.name);
          }}
          canEdit={canEditProducts}
          canDelete={canDeleteProducts}
        />
      ) : (
        <VendorProductsGrid
          products={rows}
          onView={setSelectedProductId}
          onEdit={openEdit}
          onArchive={(id) => {
            const row = rows.find((item) => item.id === id);
            void handleArchive(id, row?.name);
          }}
          canEdit={canEditProducts}
          canDelete={canDeleteProducts}
        />
      )}

      {pagination && (
        <PaginationBar
          pagination={pagination}
          page={page}
          perPage={perPage}
          perPageOptions={[...perPageOptions]}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          alwaysShow={pagination.total > 0}
          className="mt-4"
        />
      )}

      <VendorProductFormModal {...modalProps} />
    </div>
  );
}
