import type { ReactNode } from 'react';
import { PaginationBar } from '../../catalog/PaginationBar.tsx';
import { EmptyState } from '../../common/EmptyState.tsx';
import { TableSkeleton } from '../../common/TableSkeleton.tsx';
import type { PaginationMeta } from '../../../types/catalog.ts';

type DashboardPaginatedTableProps = {
  columns: ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  skeletonColumns?: number;
  skeletonRows?: number;
  children: ReactNode;
  pagination?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
};

export function DashboardPaginatedTable({
  columns,
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  skeletonColumns = 6,
  skeletonRows = 5,
  children,
  pagination,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions,
}: DashboardPaginatedTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />;
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {columns}
      {children}
      {pagination ? (
        <PaginationBar
          pagination={pagination}
          page={page}
          onPageChange={onPageChange}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          perPageOptions={perPageOptions}
          className="pt-2"
          alwaysShow={Boolean(onPerPageChange && pagination.total > 0)}
        />
      ) : null}
    </div>
  );
}
