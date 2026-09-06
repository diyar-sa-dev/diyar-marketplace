import type { ApiSuccessResponse } from './api.ts';
import type { PaginationMeta } from './catalog.ts';

export type ProjectPublicationStatus = 'draft' | 'published' | 'archived';

export interface ProjectImage {
  id: string;
  image_url: string;
  alt?: string | null;
  sort_order?: number;
}

export interface ProjectCard {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  year?: number | null;
  cover_image?: string | null;
  published_at?: string | null;
  status?: ProjectPublicationStatus;
  images_count?: number;
}

export interface ProjectDetail extends ProjectCard {
  images?: ProjectImage[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectListFilters {
  page?: number;
  per_page?: number;
  category?: string;
}

export interface PaginatedProjects {
  items: ProjectCard[];
  pagination: PaginationMeta;
}

export type ProjectsResponse = ApiSuccessResponse<PaginatedProjects>;
export type ProjectDetailResponse = ApiSuccessResponse<{ project: ProjectDetail }>;
