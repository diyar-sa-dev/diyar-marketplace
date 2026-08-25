import type { ApiSuccessResponse } from './api.ts';
import type { PaginationMeta } from './catalog.ts';

export type BlogArticleStatus = 'draft' | 'published' | 'archived';

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  published_articles_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  hero_image?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  author_role?: string | null;
  reading_time_minutes?: number | null;
  published_at?: string | null;
  status?: BlogArticleStatus;
  category?: BlogCategory | null;
  tags?: BlogTag[];
}

export interface BlogArticleDetail extends BlogArticleCard {
  content?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  user_saved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlogArticleListFilters {
  page?: number;
  per_page?: number;
  category?: string;
  tag?: string;
  q?: string;
}

export interface PaginatedBlogArticles {
  items: BlogArticleCard[];
  pagination: PaginationMeta;
}

export type BlogArticlesResponse = ApiSuccessResponse<PaginatedBlogArticles>;
export type BlogArticleDetailResponse = ApiSuccessResponse<{
  article: BlogArticleDetail;
  related: BlogArticleCard[];
}>;
export type BlogCategoriesResponse = ApiSuccessResponse<{ categories: BlogCategory[] }>;
