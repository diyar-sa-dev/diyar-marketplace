const SECTION_PLACEHOLDERS = [
  { key: 'banner', className: 'aspect-[21/9] rounded-xl' },
  { key: 'rail', className: 'h-48 md:h-56 rounded-2xl' },
  { key: 'grid', className: 'h-72 md:h-80 rounded-2xl' },
  { key: 'banner-2', className: 'aspect-[21/9] rounded-xl' },
  { key: 'features', className: 'h-64 md:h-72 rounded-2xl' },
  { key: 'promo', className: 'h-96 md:h-[28rem] rounded-3xl' },
  { key: 'blog', className: 'h-80 md:h-96 rounded-2xl' },
] as const;

/** Reserves approximate below-fold homepage height to reduce CLS when lazy chunk mounts. */
export function HomeSectionSkeleton() {
  return (
    <div className="mx-auto max-w-350 w-full px-4 py-8 space-y-8 md:space-y-12 animate-pulse" aria-hidden>
      {SECTION_PLACEHOLDERS.map((section) => (
        <div key={section.key}>
          <div className="h-6 w-40 rounded-lg bg-gray-100 mb-4" />
          <div className={`w-full bg-gray-100 ${section.className}`} />
        </div>
      ))}
    </div>
  );
}
