import { useQuery } from '@tanstack/react-query';
import { fetchPlatformCommerce } from '../api/platformCommerce.ts';

export const platformCommerceKeys = {
  all: ['platform-commerce'] as const,
};

export function usePlatformCommerce() {
  const query = useQuery({
    queryKey: platformCommerceKeys.all,
    queryFn: fetchPlatformCommerce,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  return {
    ...query,
    loyaltySarPerPoint: query.data?.loyalty_sar_per_point ?? 50,
    loyaltyPointsPerUnit: query.data?.loyalty_points_per_unit ?? 1,
    loyaltyEnabled: query.data?.loyalty_enabled ?? true,
  };
}
