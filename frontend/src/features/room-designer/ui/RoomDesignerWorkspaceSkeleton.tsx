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
        <div key={index} className="flex items-center gap-2.5 rounded-xl bg-gray-100/70 p-2">
          <ShimmerBone className="h-12 w-12 shrink-0 rounded-lg bg-gray-200/80" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBone className="h-3 w-3/4 rounded-md bg-gray-200/80" />
            <ShimmerBone className="h-2.5 w-2/5 rounded-md bg-gray-200/60" />
          </div>
          <ShimmerBone className="h-7 w-7 shrink-0 rounded-lg bg-gray-200/60" />
        </div>
      ))}
    </div>
  );
}
