import { lazyWithRetry } from '../../lib/lazyWithRetry.ts';

/** Single lazy chunk for all below-the-fold homepage sections. */
export const HomeBelowFoldSections = lazyWithRetry(
  () =>
    import('./HomeBelowFoldSections.tsx').then((module) => ({
      default: module.HomeBelowFoldSections,
    })),
  'home-below-fold',
);
