import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProviderWorkPolicy, updateProviderWorkPolicy } from '../../api/providerWorkPolicy.ts';
import type { ProviderWorkPolicyPayload } from '../../types/providerWorkPolicy.ts';

export function useProviderWorkPolicy(enabled = true) {
  return useQuery({
    queryKey: ['provider-work-policy'],
    queryFn: fetchProviderWorkPolicy,
    enabled,
  });
}

export function useUpdateProviderWorkPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProviderWorkPolicyPayload) => updateProviderWorkPolicy(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-work-policy'] });
    },
  });
}
