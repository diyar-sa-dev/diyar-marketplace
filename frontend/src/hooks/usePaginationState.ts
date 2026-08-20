import { useCallback, useState } from 'react';
import type { PaginationMeta } from '../types/catalog.ts';

export const DEFAULT_PAGINATION_PER_PAGE = 10;
export const DEFAULT_PAGINATION_OPTIONS = [10, 15, 20, 25, 50] as const;

type UsePaginationStateOptions = {
  initialPage?: number;
  initialPerPage?: number;
  perPageOptions?: readonly number[];
};

export function usePaginationState(options: UsePaginationStateOptions = {}) {
  const {
    initialPage = 1,
    initialPerPage = DEFAULT_PAGINATION_PER_PAGE,
    perPageOptions = DEFAULT_PAGINATION_OPTIONS,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const onPerPageChange = useCallback((nextPerPage: number) => {
    setPerPage(nextPerPage);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    perPage,
    perPageOptions,
    setPage,
    setPerPage,
    onPageChange,
    onPerPageChange,
    resetPage,
  };
}

type PaginationBarBinding = {
  page: number;
  perPage: number;
  perPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

export function paginationBarProps(
  pagination: PaginationMeta,
  state: PaginationBarBinding,
  extras?: { className?: string; alwaysShow?: boolean; isLoading?: boolean },
) {
  return {
    pagination,
    page: state.page,
    perPage: state.perPage,
    perPageOptions: [...state.perPageOptions],
    onPageChange: state.onPageChange,
    onPerPageChange: state.onPerPageChange,
    alwaysShow: extras?.alwaysShow ?? pagination.total > 0,
    isLoading: extras?.isLoading,
    className: extras?.className,
  };
}
