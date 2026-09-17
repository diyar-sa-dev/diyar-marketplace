import type { FilterSuggestionApply } from '../types/filterSuggestions.ts';

export function applyFilterSuggestion(
  base: URLSearchParams,
  apply: FilterSuggestionApply,
): URLSearchParams {
  const next = new URLSearchParams(base);

  if (apply.mode === 'remove') {
    for (const key of apply.remove ?? []) {
      next.delete(key);
      if (key === 'colors') {
        next.delete('color');
      }
      if (key === 'category') {
        next.delete('category_slug');
      }
    }

    next.delete('page');
    return next;
  }

  if (apply.mode === 'set') {
    for (const [key, value] of Object.entries(apply.set ?? {})) {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
        continue;
      }

      if (key === 'colors') {
        next.set('colors', String(value));
        next.delete('color');
      } else if (key === 'discounted' || key === 'remote') {
        next.set(key, value === true || value === 1 || value === '1' ? '1' : '0');
      } else {
        next.set(key, String(value));
      }
    }

    next.delete('page');
    return next;
  }

  return next;
}
