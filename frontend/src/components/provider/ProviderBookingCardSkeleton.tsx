export function ProviderBookingCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-5 w-3/4 bg-gray-100 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
        <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
