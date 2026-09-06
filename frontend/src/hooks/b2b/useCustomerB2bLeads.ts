import { useQuery } from '@tanstack/react-query';
import { fetchCustomerB2bLead, fetchCustomerB2bLeads } from '../../api/b2b.ts';
import { b2bKeys } from './queryKeys.ts';

export function useCustomerB2bLeads(page = 1, perPage = 10) {
  return useQuery({
    queryKey: b2bKeys.customerLeads(page, perPage),
    queryFn: () => fetchCustomerB2bLeads(page, perPage),
  });
}

export function useCustomerB2bLead(leadId?: string) {
  return useQuery({
    queryKey: b2bKeys.customerLead(leadId ?? ''),
    queryFn: () => fetchCustomerB2bLead(leadId!),
    enabled: Boolean(leadId),
  });
}
