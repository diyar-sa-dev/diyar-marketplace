import { useQuery } from '@tanstack/react-query';
import { fetchB2bCompanies } from '../../api/b2b.ts';
import type { B2bCompanyListFilters } from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function useB2bCompanies(
  filters: B2bCompanyListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: b2bKeys.companies(filters),
    queryFn: () => fetchB2bCompanies(filters),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}
