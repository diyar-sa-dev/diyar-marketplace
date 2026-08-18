import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vendorTeamApi from '../../api/vendorTeam.ts';
import { isForbidden, parseApiError } from '../../utils/errors.ts';

export const vendorAccessKeys = {
  all: ['vendor-access'] as const,
};

export const vendorTeamKeys = {
  all: ['vendor-team'] as const,
  list: (page: number, perPage: number, status?: 'active' | 'invited') =>
    [...vendorTeamKeys.all, page, perPage, status ?? 'active'] as const,
};

function shouldRetryVendorQuery(failureCount: number, error: unknown): boolean {
  if (isForbidden(parseApiError(error))) {
    return false;
  }

  return failureCount < 1;
}

export function useVendorAccess(enabled = true) {
  return useQuery({
    queryKey: vendorAccessKeys.all,
    queryFn: vendorTeamApi.fetchVendorAccess,
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: (query) => enabled && query.state.fetchFailureCount === 0,
    refetchOnReconnect: (query) => enabled && query.state.fetchFailureCount === 0,
    refetchOnMount: enabled ? 'always' : false,
    refetchInterval: (query) => {
      if (!enabled || query.state.fetchFailureCount > 0) {
        return false;
      }

      return 30_000;
    },
    retry: shouldRetryVendorQuery,
  });
}

export function useVendorTeam(page = 1, perPage = 10, status?: 'active' | 'invited') {
  return useQuery({
    queryKey: vendorTeamKeys.list(page, perPage, status),
    queryFn: () => vendorTeamApi.fetchVendorTeam(page, perPage, status),
  });
}

export function useInviteVendorTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorTeamApi.inviteVendorTeamMember,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorTeamKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorAccessKeys.all }),
      ]);
    },
  });
}

export function useUpdateVendorTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'manager' | 'customer_service' }) =>
      vendorTeamApi.updateVendorTeamMember(id, role),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorTeamKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorAccessKeys.all }),
      ]);
    },
  });
}

export function useRemoveVendorTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorTeamApi.removeVendorTeamMember,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorTeamKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorAccessKeys.all }),
      ]);
    },
  });
}
