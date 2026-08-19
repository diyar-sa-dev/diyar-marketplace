export function ProviderRequestCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 w-24 bg-gray-100 rounded-lg" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-gray-100 rounded mb-3" />
      <div className="space-y-2 mb-5">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-5/6 bg-gray-100 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
      </div>
      <div className="h-9 w-full bg-gray-100 rounded-xl" />
    </div>
  );
}
