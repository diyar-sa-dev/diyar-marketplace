type B2bCompanyPageSkeletonProps = {
  dir?: 'rtl' | 'ltr';
};

export function B2bCompanyPageSkeleton({ dir = 'rtl' }: B2bCompanyPageSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-pulse" dir={dir} data-testid="b2b-company-page-skeleton">
      <div className="h-56 md:h-72 bg-gray-200" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gray-200 -mt-16 md:-mt-20 shrink-0" />
            <div className="flex-1 space-y-3 pt-2 md:pt-0">
              <div className="h-5 bg-gray-200 rounded w-28" />
              <div className="h-8 bg-gray-200 rounded w-2/3 max-w-sm" />
              <div className="h-4 bg-gray-100 rounded w-40" />
            </div>
            <div className="w-full md:w-44 space-y-3">
              <div className="h-12 bg-gray-200 rounded-xl" />
              <div className="flex justify-center gap-2">
                <div className="h-10 w-10 bg-gray-100 rounded-xl" />
                <div className="h-10 w-10 bg-gray-100 rounded-xl" />
                <div className="h-10 w-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-gray-100">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 h-48" />
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 h-56" />
          </div>
          <div className="space-y-6">
            <div className="bg-gray-300 rounded-3xl h-44" />
            <div className="bg-white rounded-3xl p-6 border border-gray-100 h-40" />
            <div className="bg-white rounded-3xl p-6 border border-gray-100 h-52" />
          </div>
        </div>
      </div>
    </div>
  );
}
