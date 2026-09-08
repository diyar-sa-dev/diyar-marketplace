import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSecuritySessions,
  logoutOtherSecuritySessions,
  revokeSecuritySession,
} from '../../api/profileSecurity.ts';
import { marketplaceQueryKey } from '../../lib/auth/queryKeys.ts';

export const securitySessionKeys = {
  all: marketplaceQueryKey('security-sessions'),
  list: () => [...securitySessionKeys.all, 'list'] as const,
};

export function useSecuritySessions() {
  return useQuery({
    queryKey: securitySessionKeys.list(),
    queryFn: fetchSecuritySessions,
    staleTime: 30_000,
  });
}

export function useRevokeSecuritySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeSecuritySession,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: securitySessionKeys.all });
    },
  });
}

export function useLogoutOtherSecuritySessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutOtherSecuritySessions,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: securitySessionKeys.all });
    },
  });
}
