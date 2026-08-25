import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPartnerB2bLead,
  fetchPartnerB2bLeads,
  updatePartnerB2bLeadStatus,
} from '../../api/partnerB2b.ts';
import type {
  PartnerB2bLeadListFilters,
  PartnerB2bLeadStatus,
  PartnerB2bPortal,
} from '../../types/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function usePartnerB2bLeads(
  portal: PartnerB2bPortal,
  filters: PartnerB2bLeadListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: b2bKeys.partnerLeads(portal, filters),
    queryFn: () => fetchPartnerB2bLeads(portal, filters),
    enabled,
  });
}

export function usePartnerB2bLead(
  portal: PartnerB2bPortal,
  leadId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: b2bKeys.partnerLead(portal, leadId ?? ''),
    queryFn: () => fetchPartnerB2bLead(portal, leadId!),
    enabled: enabled && Boolean(leadId),
  });
}

export function useUpdatePartnerB2bLeadStatus(portal: PartnerB2bPortal) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      status,
    }: {
      leadId: string;
      status: Exclude<PartnerB2bLeadStatus, 'new'>;
    }) => updatePartnerB2bLeadStatus(portal, leadId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...b2bKeys.all, 'partner-leads', portal] });
      void queryClient.invalidateQueries({ queryKey: [...b2bKeys.all, 'partner-lead', portal] });
    },
  });
}
