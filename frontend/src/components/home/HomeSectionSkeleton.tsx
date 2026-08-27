export function HomeSectionSkeleton() {
  return (
    <div
      className="mx-auto max-w-350 w-full px-4 py-8 animate-pulse"
      aria-hidden
    >
      <div className="h-6 w-40 rounded-lg bg-gray-100 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-4/5 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
