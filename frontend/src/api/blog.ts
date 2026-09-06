import { apiClient } from './client.ts';
import type {
  BlogArticleDetail,
  BlogArticleCard,
  BlogArticleListFilters,
  BlogArticlesResponse,
  BlogArticleDetailResponse,
  BlogCategoriesResponse,
  BlogCategory,
  PaginatedBlogArticles,
} from '../types/blog.ts';

function buildQuery(filters: BlogArticleListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchBlogArticles(
  filters: BlogArticleListFilters = {},
): Promise<PaginatedBlogArticles> {
  const response = await apiClient.get<BlogArticlesResponse>(
    `/blog/articles${buildQuery(filters)}`,
  );
  return response.data.data;
}

export async function fetchBlogArticle(slug: string): Promise<{
  article: BlogArticleDetail;
  related: BlogArticleCard[];
}> {
  const response = await apiClient.get<BlogArticleDetailResponse>(`/blog/articles/${slug}`);
  return response.data.data;
}

export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  const response = await apiClient.get<BlogCategoriesResponse>('/blog/categories');
  return response.data.data.categories;
}

export async function fetchBlogTagArticles(
  tagSlug: string,
  filters: Omit<BlogArticleListFilters, 'tag'> = {},
): Promise<PaginatedBlogArticles> {
  const response = await apiClient.get<BlogArticlesResponse>(
    `/blog/tags/${tagSlug}${buildQuery(filters)}`,
  );
  return response.data.data;
}
