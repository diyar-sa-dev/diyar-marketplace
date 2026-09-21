export function TryInRoomShimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/55 to-transparent animate-diyar-loading-shimmer" />
    </div>
  );
}

export function ShimmerBone({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`} aria-hidden>
      <TryInRoomShimmer />
    </div>
  );
}
