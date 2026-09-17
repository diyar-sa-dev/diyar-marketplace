import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  fetchTwoFactorStatus,
} from '../../api/profileSecurity.ts';
import { marketplaceQueryKey } from '../../lib/auth/queryKeys.ts';

export const twoFactorKeys = {
  all: marketplaceQueryKey('two-factor'),
  status: () => [...twoFactorKeys.all, 'status'] as const,
};

type TwoFactorStatusFallback = {
  enabled: boolean;
  phone_masked?: string | null;
};

export function useTwoFactorStatus(fallback?: TwoFactorStatusFallback) {
  return useQuery({
    queryKey: twoFactorKeys.status(),
    queryFn: fetchTwoFactorStatus,
    staleTime: 30_000,
    retry: false,
    placeholderData: fallback
      ? {
          enabled: fallback.enabled,
          confirmed_at: null,
          phone_masked: fallback.phone_masked ?? null,
        }
      : undefined,
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableTwoFactor,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: twoFactorKeys.all });
    },
  });
}

export function useConfirmTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => confirmTwoFactor(code),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: twoFactorKeys.all });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableTwoFactor,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: twoFactorKeys.all });
    },
  });
}
