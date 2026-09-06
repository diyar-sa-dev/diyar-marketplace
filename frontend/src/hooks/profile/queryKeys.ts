import { marketplaceQueryKey } from '../../lib/auth/queryKeys.ts';

export const profileKeys = {
  all: marketplaceQueryKey('profile'),
  detail: () => [...profileKeys.all, 'detail'] as const,
};

export const addressKeys = {
  all: marketplaceQueryKey('addresses'),
  list: () => [...addressKeys.all, 'list'] as const,
};

export const wishlistKeys = {
  all: marketplaceQueryKey('wishlist'),
  summary: () => [...wishlistKeys.all, 'summary'] as const,
  list: (kind: 'products' | 'services' | 'articles', page: number, perPage: number) =>
    [...wishlistKeys.all, 'list', kind, page, perPage] as const,
};
