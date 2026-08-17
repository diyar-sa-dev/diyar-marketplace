export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
  mergeWarnings: () => [...cartKeys.all, 'merge-warnings'] as const,
};
