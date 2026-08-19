export function ProviderServiceCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
      <div className="h-36 w-full bg-gray-100 rounded-xl mb-4" />
      <div className="h-5 w-3/4 bg-gray-100 rounded mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>
      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="h-7 w-20 bg-gray-100 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-100 rounded-lg" />
          <div className="h-9 w-9 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
