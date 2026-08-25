import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { AdminPageSkeleton } from './AdminPageSkeleton.tsx';
import { useLocale } from '../../hooks/useLocale.ts';

type AdminResourceTableProps = {
  title: string;
  subtitle?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ReactNode;
  actions?: ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  columns: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminResourceTable({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyTitle,
  emptyDescription,
  columns,
  children,
  footer,
}: AdminResourceTableProps) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-diyar-dark">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 inset-s-3"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-[#f7f4f1]/60 py-2.5 text-sm outline-none transition focus:border-diyar-brown ps-10 pe-4"
            />
          </label>
          {filters}
        </div>
      </div>

      <div className="px-3 py-4 sm:px-6">
        {isLoading ? <AdminPageSkeleton /> : null}
        {isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {errorMessage ?? t('admin.dashboard.loadError')}
          </div>
        ) : null}

        {!isLoading && !isError && isEmpty ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f7f4f1]/40 px-6 py-10 text-center">
            <p className="text-base font-bold text-diyar-dark">{emptyTitle}</p>
            {emptyDescription ? (
              <p className="mt-2 max-w-md text-sm text-gray-500">{emptyDescription}</p>
            ) : null}
          </div>
        ) : null}

        {!isLoading && !isError && !isEmpty ? (
          <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-gray-100 scrollbar-hide">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f7f4f1]/80 text-gray-500">{columns}</thead>
              <tbody className="divide-y divide-gray-50">{children}</tbody>
            </table>
          </div>
        ) : null}
      </div>

      {footer ? <div className="border-t border-gray-100 px-5 py-4 sm:px-6">{footer}</div> : null}
    </section>
  );
}
