import type { ApiSuccessResponse } from './api.ts';
import type { CatalogSearchFilters } from './catalogSearch.ts';

export type FilterSuggestionAction = 'narrow' | 'relax';

export type FilterSuggestionApplyMode = 'set' | 'remove' | 'focus';

export type FilterSuggestionDisplayMode = 'ranked' | 'initialized' | 'unavailable';

export type FilterSuggestionSource = 'ranked' | 'initialized';

export interface FilterSuggestionApply {
  mode: FilterSuggestionApplyMode;
  set?: Record<string, string | number | boolean>;
  remove?: string[];
  focus_filter_key?: string;
}

export interface FilterSuggestionValue {
  value: string;
  count?: number;
  share?: number;
}

export interface FilterSuggestionItem {
  filter_key: string;
  group: string;
  presentation: string;
  priority: number;
  action: FilterSuggestionAction;
  reason_code: string;
  label?: string;
  reason?: string;
  query_parameters: string[];
  values?: FilterSuggestionValue[];
  bounds?: {
    min: number;
    max: number;
    avg: number;
  };
  apply?: FilterSuggestionApply;
  source?: FilterSuggestionSource;
}

export interface FilterSuggestionSection {
  content_type: string;
  result_count: number;
  result_density: string;
  display_mode: FilterSuggestionDisplayMode;
  degraded?: boolean;
  fallback_reason?: string;
  resolution_path?:
    | 'fresh_cache'
    | 'fresh_generate'
    | 'stale_cache'
    | 'registry_only'
    | 'disabled'
    | 'unavailable';
  suggestions: FilterSuggestionItem[];
  initialized_filters: FilterSuggestionItem[];
}

export interface FilterSuggestionsResult {
  products?: FilterSuggestionSection;
  services?: FilterSuggestionSection;
}

export type FilterSuggestionsResponse = ApiSuccessResponse<FilterSuggestionsResult>;

/** Unified catalog filters accepted by the filter-suggestions API. */
export interface FilterSuggestionsRequest extends CatalogSearchFilters {
  category?: string;
  location?: string;
  pricing_mode?: string;
  min_rating?: number;
  remote?: boolean | 0 | 1;
  provider?: string;
}
