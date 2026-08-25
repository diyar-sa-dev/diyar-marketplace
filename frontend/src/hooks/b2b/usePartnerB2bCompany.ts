import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPartnerB2bCompany,
  fetchPartnerB2bCompany,
  updatePartnerB2bCompany,
} from '../../api/partnerB2b.ts';
import type { PartnerB2bCompanyPayload, PartnerB2bPortal } from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function usePartnerB2bCompany(
  portal: PartnerB2bPortal | null,
  options: { enabled?: boolean } = {},
) {
  const enabled = (options.enabled ?? true) && portal !== null;

  return useQuery({
    queryKey: b2bKeys.partnerCompany(portal ?? 'vendor'),
    queryFn: () => fetchPartnerB2bCompany(portal!),
    enabled,
  });
}

export function useSavePartnerB2bCompany(portal: PartnerB2bPortal) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyExists,
      payload,
    }: {
      companyExists: boolean;
      payload: PartnerB2bCompanyPayload | Partial<PartnerB2bCompanyPayload>;
    }) =>
      companyExists
        ? updatePartnerB2bCompany(portal, payload)
        : createPartnerB2bCompany(portal, payload as PartnerB2bCompanyPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: b2bKeys.partnerCompany(portal) });
      queryClient.invalidateQueries({ queryKey: b2bKeys.companies() });
    },
  });
}
