import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import type { PaginationMeta } from '../../types/catalog.ts';

type AdminListMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type AdminTablePaginationProps = {
  meta: AdminListMeta | undefined;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  isLoading?: boolean;
};

function toPaginationMeta(meta: AdminListMeta): PaginationMeta {
  return {
    current_page: meta.current_page,
    last_page: meta.last_page,
    per_page: meta.per_page,
    total: meta.total,
  };
}

export function AdminTablePagination({
  meta,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  isLoading = false,
}: AdminTablePaginationProps) {
  if (!meta) {
    return null;
  }

  return (
    <PaginationBar
      pagination={toPaginationMeta(meta)}
      page={page}
      onPageChange={onPageChange}
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      isLoading={isLoading}
      alwaysShow={meta.total > 0}
    />
  );
}
