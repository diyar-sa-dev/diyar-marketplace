import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function unwrapListItems<TItem>(raw: unknown): TItem[] {
  if (Array.isArray(raw)) {
    return raw as TItem[];
  }

  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: TItem[] }).data;
  }

  return [];
}

export function useAdminListQuery<TItem>({
  resourceKey,
  endpoint,
  itemsKey,
  perPage = 20,
  extraParams,
  paramFilterKey,
  enabled = true,
}: {
  resourceKey: string;
  endpoint: string;
  itemsKey: string;
  perPage?: number;
  extraParams?: Record<string, string | undefined>;
  paramFilterKey?: string;
  enabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(perPage);
  const [statusFilter, setStatusFilter] = useState('');
  const [paramFilter, setParamFilterState] = useState('');

  const query = useQuery({
    queryKey: adminQueryKey(
      resourceKey,
      page,
      pageSize,
      debouncedSearch,
      statusFilter,
      paramFilterKey,
      paramFilter,
      extraParams,
    ),
    queryFn: async () => {
      const response = await adminApi.get<
        ApiSuccessResponse<
          Record<string, unknown> & { meta?: PaginatedMeta; pagination?: PaginatedMeta }
        >
      >(endpoint, {
        params: {
          page,
          per_page: pageSize,
          q: debouncedSearch.trim() || undefined,
          status: statusFilter || undefined,
          ...(paramFilterKey && paramFilter ? { [paramFilterKey]: paramFilter } : {}),
          ...extraParams,
        },
      });

      const data = response.data.data;
      const items = unwrapListItems<TItem>(data[itemsKey]);
      const meta = (data.meta as PaginatedMeta | undefined) ??
        (data.pagination as PaginatedMeta | undefined) ?? {
          current_page: 1,
          last_page: 1,
          per_page: pageSize,
          total: items.length,
        };

      return { items, meta };
    },
    enabled,
    placeholderData: (previousData, previousQuery) => {
      if (!previousQuery) {
        return undefined;
      }

      return previousQuery.queryKey[1] === resourceKey ? previousData : undefined;
    },
    staleTime: 120_000,
    gcTime: 300_000,
  });

  const resetPageOnFilter = useMemo(
    () => ({
      setSearch: (value: string) => {
        setSearch(value);
        setPage(1);
      },
      setStatusFilter: (value: string) => {
        setStatusFilter(value);
        setPage(1);
      },
      setParamFilter: (value: string) => {
        setParamFilterState(value);
        setPage(1);
      },
      setPerPage: (value: number) => {
        setPageSize(value);
        setPage(1);
      },
    }),
    [],
  );

  return {
    ...query,
    search,
    setSearch: resetPageOnFilter.setSearch,
    statusFilter,
    setStatusFilter: resetPageOnFilter.setStatusFilter,
    paramFilter,
    setParamFilter: resetPageOnFilter.setParamFilter,
    page,
    setPage,
    perPage: pageSize,
    setPerPage: resetPageOnFilter.setPerPage,
  };
}
