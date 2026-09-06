/** Matches default grid `ProductCard` footprint to prevent skeleton → card CLS. */
export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-gray-100 bg-white overflow-hidden animate-pulse ${className}`}
      aria-hidden
    >
      <div className="aspect-4/3 md:h-40 bg-gray-100" />
      <div className="p-3 md:p-4 space-y-2">
        <div className="h-3 w-4/5 bg-gray-100 rounded" />
        <div className="h-3 w-3/5 bg-gray-100 rounded" />
        <div className="h-4 w-2/5 bg-gray-100 rounded mt-1" />
        <div className="h-9 w-full bg-gray-100 rounded-lg mt-3" />
      </div>
    </div>
  );
}
