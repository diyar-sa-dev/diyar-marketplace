export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
};

export const addressKeys = {
  all: ['addresses'] as const,
  list: () => [...addressKeys.all, 'list'] as const,
};

export const wishlistKeys = {
  all: ['wishlist'] as const,
  summary: () => [...wishlistKeys.all, 'summary'] as const,
  list: (kind: 'products' | 'services', page: number, perPage: number) =>
    [...wishlistKeys.all, 'list', kind, page, perPage] as const,
};
