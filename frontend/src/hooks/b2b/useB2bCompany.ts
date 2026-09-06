import { useQuery } from '@tanstack/react-query';
import { fetchB2bCompany } from '../../api/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function useB2bCompany(slug: string | undefined) {
  return useQuery({
    queryKey: b2bKeys.company(slug ?? ''),
    queryFn: () => fetchB2bCompany(slug!),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}
