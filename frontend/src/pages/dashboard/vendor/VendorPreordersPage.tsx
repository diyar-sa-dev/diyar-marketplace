import { Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaginationBar } from '../../../components/catalog/PaginationBar.tsx';
import { EmptyState } from '../../../components/common/EmptyState.tsx';
import { ErrorState } from '../../../components/common/ErrorState.tsx';
import { LoadingState } from '../../../components/common/LoadingState.tsx';
import { UserAvatar } from '../../../components/profile/UserAvatar.tsx';
import { useCancelVendorPreorder, useVendorPreorders } from '../../../hooks/catalog/useProductPreorder.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { formatFinanceDateTime } from '../../../lib/formatFinanceDateTime.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { vendorButtonClass } from '../../../lib/vendorProductValidation.ts';
import { useState } from 'react';

export default function VendorPreordersPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useVendorPreorders(page, 'pending');
  const cancelPreorder = useCancelVendorPreorder();

  if (isLoading) {
    return <LoadingState className="min-h-96" />;
  }

  if (isError) {
    return <ErrorState error={error as Error} onRetry={() => void refetch()} />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const currency = t('common.currency');

  const handleCancel = async (id: string) => {
    try {
      await cancelPreorder.mutateAsync(id);
      toast.success(t('vendorPreorders.cancelSuccess'));
    } catch {
      toast.error(t('vendorPreorders.loadError'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-diyar-dark">{t('vendorPreorders.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('vendorPreorders.subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('vendorPreorders.emptyTitle')}
          description={t('vendorPreorders.emptyDescription')}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                    {item.product?.image_url ? (
                      <img
                        src={resolveMediaUrl(item.product.image_url) ?? undefined}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                        <Clock size={12} />
                        {t('vendorPreorders.pending')}
                      </span>
                      {item.created_at && (
                        <time className="text-xs text-gray-400 tabular-nums" dir="ltr">
                          {formatFinanceDateTime(item.created_at, locale)}
                        </time>
                      )}
                    </div>
                    <h3 className="font-bold text-diyar-dark truncate">
                      {item.product?.name ?? '—'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('vendorPreorders.price')}: {item.unit_price} {currency}
                      {item.selected_color?.name
                        ? ` • ${t('vendorPreorders.color')}: ${item.selected_color.name}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:w-72 shrink-0">
                  <UserAvatar
                    name={item.customer?.name ?? '?'}
                    avatarUrl={item.customer?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{t('vendorPreorders.customer')}</p>
                    <p className="font-bold text-sm text-diyar-dark truncate">
                      {item.customer?.name ?? '—'}
                    </p>
                    {item.customer?.phone && (
                      <p className="text-xs text-gray-500 mt-1" dir="ltr">
                        {item.customer.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch shrink-0">
                  {item.product?.id && (
                    <Link
                      to={`/product/${item.product.id}`}
                      className={`${vendorButtonClass} px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 text-center`}
                    >
                      {t('vendorPreorders.product')}
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={cancelPreorder.isPending}
                    onClick={() => void handleCancel(item.id)}
                    className={`${vendorButtonClass} px-4 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60`}
                  >
                    {t('vendorPreorders.cancel')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <PaginationBar pagination={pagination} page={page} onPageChange={setPage} />
      )}
    </div>
  );
}
