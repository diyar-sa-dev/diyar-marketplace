import { useQuery } from '@tanstack/react-query';
import { fetchPlatformTheme } from '../api/platformTheme.ts';

export const platformThemeKeys = {
  all: ['platform-theme'] as const,
};

export function usePlatformThemeQuery(enabled = true) {
  return useQuery({
    queryKey: platformThemeKeys.all,
    queryFn: fetchPlatformTheme,
    staleTime: 5 * 60_000,
    enabled,
  });
}
