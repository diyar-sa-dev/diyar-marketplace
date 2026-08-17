export function VendorReturnsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 max-w-full rounded bg-gray-100" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 w-24 shrink-0 rounded-xl bg-gray-200" />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-gray-100" />
                <div className="h-5 w-40 rounded bg-gray-200" />
                <div className="h-4 w-56 max-w-full rounded bg-gray-100" />
              </div>
              <div className="h-5 w-16 rounded bg-gray-200" />
            </div>
            <div className="h-20 rounded-xl bg-gray-50" />
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-lg bg-gray-200" />
              <div className="h-9 w-24 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
