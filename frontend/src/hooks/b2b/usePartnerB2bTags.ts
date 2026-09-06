import { useQuery } from '@tanstack/react-query';
import { fetchPartnerB2bTags } from '../../api/partnerB2b.ts';
import type { PartnerB2bPortal } from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function usePartnerB2bTags(portal: PartnerB2bPortal) {
  return useQuery({
    queryKey: b2bKeys.partnerTags(portal),
    queryFn: () => fetchPartnerB2bTags(portal),
  });
}
