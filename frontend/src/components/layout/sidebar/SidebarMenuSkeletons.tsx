export function ProjectShowcaseListSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5">
      <div className="w-full md:w-2/5 h-44 md:h-48 bg-gray-100 animate-pulse shrink-0" />
      <div className="p-5 md:py-6 flex-1 space-y-3">
        <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
        <div className="h-5 w-3/4 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="h-3 w-20 bg-gray-100 animate-pulse rounded" />
          <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProjectShowcaseDetailSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="w-full h-56 md:h-72 bg-gray-100 animate-pulse" />
      <div className="p-5 md:p-6 space-y-4">
        <div className="h-3 w-28 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-40 bg-gray-100 animate-pulse rounded" />
        <div className="h-6 w-2/3 bg-gray-100 animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 animate-pulse rounded" />
          <div className="h-3 w-full bg-gray-100 animate-pulse rounded" />
          <div className="h-3 w-4/5 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="pt-4 border-t border-gray-50">
          <div className="h-3 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
