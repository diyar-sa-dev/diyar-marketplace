import React from 'react';
import { Loader2 } from 'lucide-react';
import ProductCard from '../cards/ProductCard.tsx';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { SearchResultsSkeleton } from './SearchResultsSkeleton.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { mapProductCard } from '../../lib/catalogMappers.ts';
import type { PaginationMeta } from '../../types/catalog.ts';
import type { VisualSearchProduct } from '../../types/visualSearch.ts';

const PER_PAGE_OPTIONS = [12, 24, 36, 48] as const;

interface VisualSearchResultsSectionProps {
  previewUrl?: string;
  items: VisualSearchProduct[];
  pagination?: PaginationMeta;
  page: number;
  perPage: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  sarPerPoint: number;
  pointsPerUnit: number;
  minSimilarity: number;
  minSimilarityPercent: number;
}

export function VisualSearchResultsSection({
  previewUrl,
  items,
  pagination,
  page,
  perPage,
  isLoading,
  isFetching,
  isError,
  error,
  onRetry,
  onPageChange,
  onPerPageChange,
  sarPerPoint,
  pointsPerUnit,
  minSimilarity,
  minSimilarityPercent,
}: VisualSearchResultsSectionProps) {
  const { t } = useLocale();

  const matchedItems = items.filter(
    (item) => (item.similarity ?? 0) >= minSimilarity,
  );
  const total = pagination?.total ?? matchedItems.length;
  const showInitialSkeleton = isLoading && items.length === 0;
  const showSubtleLoading = isFetching && items.length > 0;

  return (
    <div className="space-y-6">
      {previewUrl ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
            <div className="mx-auto w-full max-w-xs shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 md:mx-0">
              <img
                src={previewUrl}
                alt={t('catalog.search.uploadedImage')}
                className="mx-auto max-h-48 w-full object-contain md:max-h-40"
              />
            </div>
            <div className="min-w-0 flex-1 text-center md:text-start">
              <p className="text-sm font-bold text-diyar-dark">{t('catalog.search.uploadedImage')}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {t('catalog.search.uploadedImageDescription')}
              </p>
              {!showInitialSkeleton && !isError && matchedItems.length > 0 ? (
                <p className="mt-3 text-sm font-medium text-diyar-brown">
                  {t('catalog.search.visualSearchHighMatchCount', {
                    count: matchedItems.length,
                    percent: minSimilarityPercent,
                  })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showSubtleLoading ? (
        <p className="inline-flex items-center gap-2 text-xs text-diyar-brown">
          <Loader2 size={14} className="animate-spin" />
          {t('catalog.search.updating')}
        </p>
      ) : null}

      {isError ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : showInitialSkeleton ? (
        <SearchResultsSkeleton count={Math.min(perPage, 8)} />
      ) : matchedItems.length > 0 ? (
        <div className="space-y-6">
          <div
            className={`grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 ${
              isFetching ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {matchedItems.map((item) => {
              const product = mapProductCard(item, {
                sarPerPoint,
                pointsPerUnit,
              });

              return (
                <div key={item.id} className="relative">
                  {typeof item.similarity === 'number' ? (
                    <span className="absolute start-3 top-3 z-10 rounded-full bg-diyar-dark/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      {Math.round(item.similarity * 100)}%
                    </span>
                  ) : null}
                  <ProductCard product={product} />
                </div>
              );
            })}
          </div>

          {pagination ? (
            <PaginationBar
              pagination={pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...PER_PAGE_OPTIONS]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              alwaysShow={pagination.total > 0}
              isLoading={isFetching}
            />
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={t('catalog.search.visualSearchEmptyTitle')}
          description={t('catalog.search.visualSearchEmptyDescription', {
            percent: minSimilarityPercent,
          })}
        />
      )}
    </div>
  );
}
