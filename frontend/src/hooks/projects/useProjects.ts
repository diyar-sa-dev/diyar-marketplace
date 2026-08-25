import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '../../api/projects.ts';
import type { ProjectListFilters } from '../../types/project.ts';
import { projectKeys } from './queryKeys.ts';

export function useProjects(filters: ProjectListFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => fetchProjects(filters),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}
