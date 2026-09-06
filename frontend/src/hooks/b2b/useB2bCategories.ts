import { useQuery } from '@tanstack/react-query';
import { fetchB2bCategories } from '../../api/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function useB2bCategories() {
  return useQuery({
    queryKey: b2bKeys.categories(),
    queryFn: fetchB2bCategories,
    staleTime: 10 * 60 * 1000,
  });
}
