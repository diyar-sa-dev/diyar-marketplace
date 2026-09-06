import { Suspense } from 'react';
import { HomeBelowFoldSections } from './homeLazySections.ts';
import { HomeSectionSkeleton } from './HomeSectionSkeleton.tsx';

/** Below-fold sections: lazy chunk loads immediately (no IO defer) to avoid skeleton→content CLS. */
export function DeferredHomeBelowFold() {
  return (
    <div data-testid="home-below-fold-deferred">
      <Suspense fallback={<HomeSectionSkeleton />}>
        <HomeBelowFoldSections />
      </Suspense>
    </div>
  );
}
