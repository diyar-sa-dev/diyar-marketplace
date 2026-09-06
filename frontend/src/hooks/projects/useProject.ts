import { useQuery } from '@tanstack/react-query';
import { fetchProject } from '../../api/projects.ts';
import { projectKeys } from './queryKeys.ts';
import { isNotFoundError } from '../../utils/errors.ts';

export function useProject(slug: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.detail(slug ?? ''),
    queryFn: () => fetchProject(slug!),
    enabled: options?.enabled !== false && Boolean(slug),
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
