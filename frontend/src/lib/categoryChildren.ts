import type { Category } from '../types/catalog.ts';

type CategoryChildrenPayload =
  | Category[]
  | { data?: Category[] | null }
  | null
  | undefined;

/** API may return nested children as a plain array or a Laravel resource `{ data: [] }`. */
export function listCategoryChildren(children: CategoryChildrenPayload): Category[] {
  if (Array.isArray(children)) {
    return children;
  }

  if (children && typeof children === 'object' && Array.isArray(children.data)) {
    return children.data;
  }

  return [];
}
