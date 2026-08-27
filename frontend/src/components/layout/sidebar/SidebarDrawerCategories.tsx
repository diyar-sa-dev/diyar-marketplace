import { ChevronLeft, ChevronDown } from 'lucide-react';

type BrowseCategory = {
  slug: string;
  name: string;
  subcategories: Array<{ name: string; slug: string | null }>;
};

type SidebarDrawerCategoriesProps = {
  t: (key: string, params?: Record<string, string>) => string;
  handleNavigate: (path: string) => void;
  showCategoriesSection: boolean;
  setShowCategoriesSection: (value: boolean) => void;
  categoriesLoading: boolean;
  browseCategories: BrowseCategory[];
  openCategory: string | null;
  setOpenCategory: (slug: string | null) => void;
};

export function SidebarDrawerCategories({
  t,
  handleNavigate,
  showCategoriesSection,
  setShowCategoriesSection,
  categoriesLoading,
  browseCategories,
  openCategory,
  setOpenCategory,
}: SidebarDrawerCategoriesProps) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <button
        onClick={() => setShowCategoriesSection(!showCategoriesSection)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
      >
        <span>{t('layout.sidebar.browseByCategory')}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${showCategoriesSection ? 'rotate-180 text-diyar-brown' : ''}`}
        />
      </button>

      {showCategoriesSection && (
        <div className="mt-3 space-y-1 pl-1 pr-1 bg-gray-50/50 rounded-2xl p-1.5 border border-gray-100/70 animate-in fade-in duration-200">
          {categoriesLoading ? (
            <p className="text-xs text-gray-500 px-3 py-2">
              {t('layout.sidebar.loadingCategories')}
            </p>
          ) : browseCategories.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-2">{t('layout.sidebar.noCategories')}</p>
          ) : (
            browseCategories.map((category) => (
              <div key={category.slug}>
                <button
                  onClick={() =>
                    setOpenCategory(openCategory === category.slug ? null : category.slug)
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white transition-all text-xs font-bold text-diyar-dark cursor-pointer"
                >
                  <span className={openCategory === category.slug ? 'text-diyar-brown' : ''}>
                    {category.name}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`opacity-60 transition-transform ${openCategory === category.slug ? 'rotate-180' : ''}`}
                  />
                </button>

                {openCategory === category.slug && (
                  <div className="px-3 py-1 space-y-1 bg-white mx-1 my-1 rounded-xl border border-gray-100 animate-in fade-in duration-150">
                    <button
                      onClick={() => handleNavigate(`/category/${category.slug}`)}
                      className="text-right w-full text-[11px] text-diyar-brown font-bold py-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      {t('layout.sidebar.allInCategory', { name: category.name })}
                      <ChevronLeft size={12} />
                    </button>
                    {category.subcategories.map((sub) => (
                      <button
                        key={`${category.slug}-${sub.slug ?? sub.name}`}
                        onClick={() =>
                          handleNavigate(
                            sub.slug
                              ? `/category/${sub.slug}`
                              : `/category/${category.slug}?q=${encodeURIComponent(sub.name)}`,
                          )
                        }
                        className="text-right w-full text-[11px] text-gray-500 py-1.5 hover:text-diyar-brown transition-all pr-1 cursor-pointer"
                      >
                        • {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export type { BrowseCategory };
