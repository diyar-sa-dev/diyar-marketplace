import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function useAdminListQuery<TItem>({
  resourceKey,
  endpoint,
  itemsKey,
  perPage = 20,
  extraParams,
  paramFilterKey,
}: {
  resourceKey: string;
  endpoint: string;
  itemsKey: string;
  perPage?: number;
  extraParams?: Record<string, string | undefined>;
  paramFilterKey?: string;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paramFilter, setParamFilterState] = useState('');

  const query = useQuery({
    queryKey: adminQueryKey(
      resourceKey,
      page,
      perPage,
      search,
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
          per_page: perPage,
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          ...(paramFilterKey && paramFilter ? { [paramFilterKey]: paramFilter } : {}),
          ...extraParams,
        },
      });

      const data = response.data.data;
      const items = (data[itemsKey] as TItem[]) ?? [];
      const meta = (data.meta as PaginatedMeta | undefined) ??
        (data.pagination as PaginatedMeta | undefined) ?? {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: items.length,
        };

      return { items, meta };
    },
    placeholderData: (previous) => previous,
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
    perPage,
  };
}
