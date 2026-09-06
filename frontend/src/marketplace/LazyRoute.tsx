import { Suspense, type ReactNode } from 'react';

export function PageRouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-diyar-brown/30 border-t-diyar-brown rounded-full animate-spin" />
    </div>
  );
}

/** Matches Hero min-height so the home route does not jump while HomePage chunk loads. */
export function HomeRouteFallback() {
  return (
    <div
      className="h-[min(88vh,720px)] md:h-[calc(100vh-48px)] w-full rounded-b-3xl md:rounded-b-4xl animate-pulse bg-gray-50"
      aria-hidden
    />
  );
}

export function LazyRoute({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback ?? <PageRouteFallback />}>{children}</Suspense>;
}
