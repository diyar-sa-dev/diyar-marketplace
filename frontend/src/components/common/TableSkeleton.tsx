type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function TableSkeleton({ rows = 5, columns = 6, className = '' }: TableSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="hidden rounded-xl border border-gray-100 bg-gray-50 px-6 py-3 md:grid md:gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="rounded-2xl border border-gray-100 bg-white p-4 md:grid md:items-center md:gap-3 md:px-6 md:py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 animate-pulse rounded bg-gray-100"
              style={{ width: colIndex === 0 ? '70%' : '85%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
