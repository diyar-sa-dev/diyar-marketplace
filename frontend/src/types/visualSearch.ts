import type { ProductCard } from './catalog.ts';

export const VISUAL_SEARCH_QUERY = 'visual_search_results';

export interface VisualSearchProduct extends ProductCard {
  similarity: number;
}

export interface VisualSearchMeta {
  search_id: string;
  engine_version: string;
  representation_version: string;
  ranking_version?: string;
  index_version: string;
  result_count: number;
  cache?: string;
}

export interface VisualSearchResponse {
  success: boolean;
  data: {
    items: VisualSearchProduct[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
  meta: VisualSearchMeta;
}

export interface VisualSearchLocationState {
  visualSearch?: {
    items: VisualSearchProduct[];
    meta: VisualSearchMeta;
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const VISUAL_SEARCH_DEFAULT_PER_PAGE = 12;

/** Only show high-confidence visual matches in storefront results (90–100%). */
export const VISUAL_SEARCH_MIN_DISPLAY_SIMILARITY = 0.9;
