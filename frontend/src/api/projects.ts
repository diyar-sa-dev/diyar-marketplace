import { apiClient } from './client.ts';
import type {
  PaginatedProjects,
  ProjectDetail,
  ProjectListFilters,
  ProjectDetailResponse,
  ProjectsResponse,
} from '../types/project.ts';

function buildQuery(filters: ProjectListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchProjects(filters: ProjectListFilters = {}): Promise<PaginatedProjects> {
  const response = await apiClient.get<ProjectsResponse>(`/projects${buildQuery(filters)}`);
  return response.data.data;
}

export async function fetchProject(slug: string): Promise<ProjectDetail> {
  const response = await apiClient.get<ProjectDetailResponse>(`/projects/${slug}`);
  return response.data.data.project;
}
