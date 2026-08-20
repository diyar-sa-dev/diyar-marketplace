type NotificationSkeletonProps = {
  count?: number;
  compact?: boolean;
};

export function NotificationSkeleton({ count = 3, compact = false }: NotificationSkeletonProps) {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${compact ? 'p-4' : 'p-5 md:p-6'} flex gap-4 animate-pulse`}>
          <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl bg-gray-100 shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-9 w-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
