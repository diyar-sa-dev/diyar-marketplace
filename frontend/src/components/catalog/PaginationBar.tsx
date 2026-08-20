import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import type { PaginationMeta } from '../../types/catalog.ts';

interface PaginationBarProps {
  pagination: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
  alwaysShow?: boolean;
  isLoading?: boolean;
}

function buildPageNumbers(current: number, last: number): (number | 'ellipsis')[] {
  if (last <= 1) {
    return [1];
  }

  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  if (current < last - 2) {
    pages.push('ellipsis');
  }

  if (!pages.includes(last)) {
    pages.push(last);
  }

  return pages;
}

export function PaginationBar({
  pagination,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = [10, 15, 20, 25, 50],
  className = '',
  alwaysShow = false,
  isLoading = false,
}: PaginationBarProps) {
  const { t } = useLocale();

  const effectivePerPage = pagination.per_page;
  const from = pagination.total === 0 ? 0 : (pagination.current_page - 1) * effectivePerPage + 1;
  const to = Math.min(pagination.current_page * effectivePerPage, pagination.total);
  const pageNumbers = buildPageNumbers(pagination.current_page, pagination.last_page);
  const selectValue = perPage ?? pagination.per_page;

  if (pagination.last_page <= 1 && !alwaysShow && !onPerPageChange) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className} ${
        isLoading ? 'opacity-70 pointer-events-none' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 order-2 sm:order-1">
        <p className="text-xs text-gray-500">
          {t('common.pagination.summary', {
            from: String(from),
            to: String(to),
            total: String(pagination.total),
          })}
        </p>

        {onPerPageChange && (
          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium whitespace-nowrap">{t('common.pagination.perPage')}</span>
            <select
              value={selectValue}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              disabled={isLoading}
              className="h-9 min-w-18 rounded-xl border border-gray-200 bg-white px-2 text-sm font-bold text-diyar-dark cursor-pointer hover:border-diyar-brown focus:border-diyar-brown focus:outline-none disabled:opacity-50"
              aria-label={t('common.pagination.perPage')}
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center sm:justify-end gap-1 order-1 sm:order-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-diyar-brown disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
            aria-label={t('common.pagination.previous')}
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(item)}
                aria-label={t('common.pagination.page', { page: String(item) })}
                aria-current={item === page ? 'page' : undefined}
                className={`min-w-9 h-9 px-2 rounded-xl border text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  item === page
                    ? 'bg-diyar-dark text-white border-diyar-dark'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-diyar-brown'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page >= pagination.last_page || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-diyar-brown disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
            aria-label={t('common.pagination.next')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
