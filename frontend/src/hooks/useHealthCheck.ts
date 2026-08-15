import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health.ts';

export function useHealthCheck(enabled = false) {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    enabled,
  });
}
