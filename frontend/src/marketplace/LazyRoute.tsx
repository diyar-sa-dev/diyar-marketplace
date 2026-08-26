import { Suspense, type ReactNode } from 'react';

export function PageRouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-diyar-brown/30 border-t-diyar-brown rounded-full animate-spin" />
    </div>
  );
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageRouteFallback />}>{children}</Suspense>;
}
