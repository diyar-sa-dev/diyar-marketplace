import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Eye } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';

type ReviewTab = 'products' | 'stores' | 'providers';

export default function AdminReviewsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReviewTab>('products');

  const endpoint =
    tab === 'products'
      ? '/admin/reviews/products'
      : tab === 'stores'
        ? '/admin/reviews/stores'
        : '/admin/reviews/providers';

  const itemsKey =
    tab === 'products'
      ? 'product_reviews'
      : tab === 'stores'
        ? 'store_reviews'
        : 'provider_reviews';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reviews', tab],
    queryFn: async () => {
      const response = await adminApi.get<
        ApiSuccessResponse<Record<string, unknown> & { meta?: { total: number } }>
      >(endpoint, { params: { per_page: 20 } });
      return {
        items: (response.data.data[itemsKey] as Array<Record<string, unknown>>) ?? [],
        meta: response.data.data.meta,
      };
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'hide' | 'unhide' }) =>
      adminApi.post(`/admin/reviews/providers/${id}/${action}`),
    onSuccess: async () => {
      toast.success(t('admin.reviews.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: () => toast.error(t('admin.reviews.updateError')),
  });

  const tabs: Array<{ id: ReviewTab; label: string }> = [
    { id: 'products', label: t('admin.reviews.products') },
    { id: 'stores', label: t('admin.reviews.stores') },
    { id: 'providers', label: t('admin.reviews.providers') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer ${
              tab === item.id
                ? 'bg-diyar-dark text-white'
                : 'border border-gray-200 bg-white text-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AdminResourceTable
        title={t('admin.nav.reviews')}
        subtitle={t('admin.reviews.subtitle')}
        searchValue=""
        onSearchChange={() => undefined}
        searchPlaceholder={t('admin.tables.searchReviews')}
        isLoading={isLoading}
        isError={isError}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyTitle={t('admin.reviews.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.rating')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.comment')}</th>
            {tab === 'providers' ? (
              <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
            ) : null}
          </tr>
        }
      >
        {(data?.items ?? []).map((review, index) => (
          <tr key={String(review.id ?? index)} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3 text-sm font-semibold">{String(review.rating ?? '—')}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{String(review.comment ?? '—')}</td>
            {tab === 'providers' ? (
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <PermissionGate permission="reviews.moderate">
                    <button
                      type="button"
                      disabled={moderateMutation.isPending}
                      onClick={() =>
                        moderateMutation.mutate({
                          id: String(review.id),
                          action: review.is_hidden ? 'unhide' : 'hide',
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                    >
                      {review.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>
                        {review.is_hidden ? t('admin.reviews.unhide') : t('admin.reviews.hide')}
                      </span>
                    </button>
                  </PermissionGate>
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </AdminResourceTable>
    </div>
  );
}
