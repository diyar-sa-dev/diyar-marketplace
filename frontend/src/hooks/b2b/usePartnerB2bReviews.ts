import { useQuery } from '@tanstack/react-query';
import { fetchPartnerB2bReviews } from '../../api/b2bReviews.ts';
import type { PartnerB2bPortal } from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function usePartnerB2bReviews(portal: PartnerB2bPortal, page = 1, perPage = 10) {
  return useQuery({
    queryKey: [...b2bKeys.partnerReviews(portal), page, perPage],
    queryFn: () => fetchPartnerB2bReviews(portal, page, perPage),
  });
}
