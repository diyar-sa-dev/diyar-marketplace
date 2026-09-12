import {
  VISUAL_SEARCH_DEFAULT_PER_PAGE,
  VISUAL_SEARCH_QUERY,
  type VisualSearchResponse,
} from '../types/visualSearch.ts';

export function buildVisualSearchPath(response: VisualSearchResponse): string {
  const params = new URLSearchParams({
    q: VISUAL_SEARCH_QUERY,
    search_id: response.meta.search_id,
    page: String(response.data.pagination.current_page),
    per_page: String(response.data.pagination.per_page ?? VISUAL_SEARCH_DEFAULT_PER_PAGE),
  });

  return `/search?${params.toString()}`;
}

export function buildVisualSearchLocationState(response: VisualSearchResponse) {
  return {
    visualSearch: {
      items: response.data.items,
      meta: response.meta,
      pagination: response.data.pagination,
    },
  };
}
