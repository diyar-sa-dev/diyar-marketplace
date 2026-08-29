import { Suspense, useEffect, useRef, useState } from 'react';
import { HomeBelowFoldSections } from './homeLazySections.ts';
import { HomeSectionSkeleton } from './HomeSectionSkeleton.tsx';

/** Mount below-fold homepage sections only when near viewport. */
export function DeferredHomeBelowFold() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || visible) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef} data-testid="home-below-fold-deferred">
      {visible ? (
        <Suspense fallback={<HomeSectionSkeleton />}>
          <HomeBelowFoldSections />
        </Suspense>
      ) : (
        <HomeSectionSkeleton />
      )}
    </div>
  );
}
