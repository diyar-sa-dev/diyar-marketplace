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
  list: (page: number, perPage: number) => [...wishlistKeys.all, 'list', page, perPage] as const,
};
