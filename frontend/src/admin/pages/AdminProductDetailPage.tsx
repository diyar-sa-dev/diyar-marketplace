import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  price?: string;
  vendor_account?: { id: string; business_name: string; slug: string };
  category?: { id: string; name: string };
};

export default function AdminProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    isError,
  } = useAdminDetailQuery<ProductDetail>({
    resourceKey: 'admin-product-detail',
    endpoint: `/admin/products/${productId}`,
    dataKey: 'product',
    enabled: Boolean(productId),
  });

  const activateMutation = useMutation({
    mutationFn: async () => adminApi.post(`/admin/products/${productId}/activate`),
    onSuccess: async () => {
      toast.success(t('admin.detail.product.activated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-product-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => toast.error(t('admin.detail.product.actionError')),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => adminApi.post(`/admin/products/${productId}/deactivate`),
    onSuccess: async () => {
      toast.success(t('admin.detail.product.deactivated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-product-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => toast.error(t('admin.detail.product.actionError')),
  });

  if (isLoading) return <AdminPageSkeleton />;

  if (isError || !product) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.detail.product.loadError')}
      </div>
    );
  }

  const isActive = product.status === 'active';

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/products"
        backLabel={t('admin.detail.backToProducts')}
        title={product.name}
        subtitle={product.slug}
        status={product.status}
        actions={
          <PermissionGate permission="products.update">
            {isActive ? (
              <button
                type="button"
                disabled={deactivateMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('admin.detail.product.deactivateConfirm'))) {
                    deactivateMutation.mutate();
                  }
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              >
                {t('admin.detail.product.deactivate')}
              </button>
            ) : (
              <button
                type="button"
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
              >
                {t('admin.detail.product.activate')}
              </button>
            )}
          </PermissionGate>
        }
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.status')}
            </dt>
            <dd className="mt-1">
              <AdminStatusBadge status={product.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.amount')}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums" dir="ltr">
              {product.price ?? '—'}
            </dd>
          </div>
          {product.vendor_account ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.nav.vendors')}
              </dt>
              <dd className="mt-1">
                <Link
                  to={`/admin/vendors/${product.vendor_account.id}`}
                  className="font-semibold text-diyar-brown hover:text-diyar-dark"
                >
                  {product.vendor_account.business_name}
                </Link>
              </dd>
            </div>
          ) : null}
          {product.category ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.nav.categories')}
              </dt>
              <dd className="mt-1 text-gray-700">{product.category.name}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Link
              to={`/product/${product.slug}`}
              className="inline-flex items-center rounded-xl border border-diyar-brown/30 bg-diyar-brown/5 px-4 py-2 text-sm font-semibold text-diyar-brown hover:bg-diyar-brown/10"
            >
              {t('admin.viewStore')} — {product.name}
            </Link>
          </div>
        </dl>
      </div>
    </div>
  );
}
