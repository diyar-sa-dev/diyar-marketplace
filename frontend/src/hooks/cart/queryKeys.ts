export const cartKeys = {
  all: ['marketplace', 'cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
  mergeWarnings: () => [...cartKeys.all, 'merge-warnings'] as const,
};
