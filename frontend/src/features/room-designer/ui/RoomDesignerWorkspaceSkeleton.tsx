import { ShimmerBone } from '../../try-in-room/TryInRoomShimmer.tsx';

export function RoomDesignerWorkspaceSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-col gap-3"
      data-testid="room-designer-page-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <ShimmerBone key={index} className="h-11 w-11 shrink-0 rounded-xl" />
        ))}
        <ShimmerBone className="h-11 w-28 shrink-0 rounded-xl" />
        <ShimmerBone className="ms-auto h-11 w-11 shrink-0 rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        <ShimmerBone className="h-10 w-36 shrink-0 rounded-xl" />
        <ShimmerBone className="h-10 w-32 shrink-0 rounded-xl" />
        <ShimmerBone className="h-10 w-28 shrink-0 rounded-xl" />
      </div>
      <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(220px,280px)_1fr] lg:gap-4">
        <div className="hidden space-y-2 lg:block">
          <ShimmerBone className="h-11 rounded-xl" />
          {Array.from({ length: 5 }).map((_, index) => (
            <ShimmerBone key={index} className="h-16 rounded-xl" />
          ))}
        </div>
        <ShimmerBone className="min-h-[min(42dvh,380px)] rounded-2xl md:min-h-[min(52dvh,520px)]" />
      </div>
    </div>
  );
}

export function CatalogRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2" data-testid="room-designer-catalog-skeleton" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-2.5 rounded-xl border border-diyar-brown/15 bg-white p-2 shadow-2xs">
          <ShimmerBone className="h-13 w-13 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <ShimmerBone className="h-3 w-4/5 rounded-md" />
            <ShimmerBone className="h-2.5 w-1/2 rounded-md" />
          </div>
          <ShimmerBone className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
