import { useQuery } from '@tanstack/react-query';
import { fetchPartnerB2bCategories } from '../../api/partnerB2b.ts';
import type { PartnerB2bPortal } from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function usePartnerB2bCategories(portal: PartnerB2bPortal) {
  return useQuery({
    queryKey: b2bKeys.partnerCategories(portal),
    queryFn: () => fetchPartnerB2bCategories(portal),
    staleTime: 10 * 60 * 1000,
  });
}
