export function AdminChatReportDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 rounded-lg bg-gray-100" />
          <div className="h-3 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-7 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="h-16 rounded-2xl bg-gray-50" />
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="h-20 rounded-2xl bg-amber-50/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="space-y-2 rounded-2xl bg-[#faf9f7] p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 rounded-xl bg-white" />
          ))}
        </div>
      </div>
      <div className="h-36 rounded-2xl bg-gray-50" />
    </div>
  );
}
