export function AdminPageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-gray-100" />
      <div className="h-12 rounded-2xl bg-gray-100" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-14 rounded-xl bg-gray-50" />
      ))}
    </div>
  );
}
