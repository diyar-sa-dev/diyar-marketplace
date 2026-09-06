import React, { useEffect, useState } from 'react';
import { Search, Link as LinkIcon, Loader2 } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import {
  useAffiliateProducts,
  useAffiliatePlatformConfig,
  useCreateAffiliateLink,
} from '../../hooks/affiliate/useAffiliate.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState, paginationBarProps } from '../../hooks/usePaginationState.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { AffiliatePlatformHints } from '../../components/affiliate/AffiliatePlatformHints.tsx';
import { usePortalTheme } from '../../lib/dashboard/portalTheme.ts';
import type { AffiliateProductSetting } from '../../types/affiliate.ts';

const FALLBACK_IMAGE = '/placeholder-product.png';
const SEARCH_DEBOUNCE_MS = 400;

function formatWesternNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function AffiliateProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="flex justify-between pt-2">
              <div className="h-8 w-16 bg-gray-100 rounded" />
              <div className="h-8 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AffiliateProducts() {
  const { t, locale } = useLocale();
  const theme = usePortalTheme();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 12 });
  const [creatingProductId, setCreatingProductId] = useState<string | null>(null);

  const productsQuery = useAffiliateProducts(page, perPage, debouncedSearch);
  const platformQuery = useAffiliatePlatformConfig();
  const createLink = useCreateAffiliateLink();

  const products = productsQuery.data?.products ?? [];
  const searchPending = searchTerm !== debouncedSearch;
  const showSkeleton =
    productsQuery.isLoading || searchPending || (productsQuery.isFetching && !productsQuery.data);

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, resetPage]);

  const handleGenerateLink = async (item: AffiliateProductSetting) => {
    const productName = item.product?.name ?? 'Marketing link';

    setCreatingProductId(item.product_id);
    try {
      const link = await createLink.mutateAsync({
        name: productName,
        product_id: item.product_id,
        commission_rate_percent: Number(item.commission_rate_percent),
      });

      if (link.public_url) {
        await navigator.clipboard.writeText(link.public_url);
      }

      toast.success(t('affiliate.linkCreated'));
      if (link.public_url) {
        toast.success(t('affiliate.copySuccess'));
      }
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    } finally {
      setCreatingProductId(null);
    }
  };

  if (productsQuery.isError) {
    return (
      <ErrorState
        message={t('affiliate.products.loadError')}
        onRetry={() => void productsQuery.refetch()}
      />
    );
  }

  const pagination = productsQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('affiliate.products.title')}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="search"
              placeholder={t('affiliate.products.searchPlaceholder')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="ps-10 pe-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 text-sm w-full md:w-64"
            />
            <Search
              size={18}
              className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {platformQuery.data ? (
        <AffiliatePlatformHints platform={platformQuery.data} variant="marketer" />
      ) : null}

      {showSkeleton ? (
        <AffiliateProductGridSkeleton />
      ) : products.length === 0 ? (
        <EmptyState title={t('affiliate.emptyProducts')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((item) => {
              const product = item.product;
              const price = Number(product?.sale_price ?? 0);
              const commission = Number(item.commission_rate_percent);
              const earn = item.expected_commission ?? ((price * commission) / 100).toFixed(2);
              const isCreating = creatingProductId === item.product_id;

              return (
                <div
                  key={item.product_id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={resolveMediaUrl(product?.image_url) ?? FALLBACK_IMAGE}
                      alt={product?.name ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className={`absolute top-3 inset-e-3 ${theme.badge} text-xs font-bold px-2 py-1 rounded w-fit`}
                    >
                      {t('affiliate.products.commissionBadge', {
                        rate: item.commission_rate_percent,
                      })}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {product?.vendor?.business_name ?? t('affiliate.common.noData')}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 truncate">
                      {product?.name ?? t('affiliate.common.noData')}
                    </h3>

                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <div>
                        <div className="text-xs text-gray-500">
                          {t('affiliate.products.productPrice')}
                        </div>
                        <div className="font-medium text-gray-900" dir="ltr">
                          {formatWesternNumber(price)} {t('common.currency')}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-500">
                          {t('affiliate.products.expectedEarnings')}
                        </div>
                        <div className={theme.amount}>
                          {earn} {t('common.currency')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isCreating || createLink.isPending}
                      onClick={() => void handleGenerateLink(item)}
                      className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isCreating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LinkIcon size={16} />
                      )}
                      {t('affiliate.products.generateLink')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && (
            <PaginationBar
              {...paginationBarProps(pagination, {
                page,
                perPage,
                perPageOptions,
                onPageChange,
                onPerPageChange,
              })}
            />
          )}
        </>
      )}
    </div>
  );
}
