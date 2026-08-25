export function B2bCompanyCardSkeleton() {
  return (
    <div
      data-testid="b2b-company-card-skeleton"
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse flex flex-col"
    >
      <div className="h-40 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4 mt-6" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-10 bg-gray-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function B2bCompanyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="b2b-company-grid-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <B2bCompanyCardSkeleton key={index} />
      ))}
    </div>
  );
}
