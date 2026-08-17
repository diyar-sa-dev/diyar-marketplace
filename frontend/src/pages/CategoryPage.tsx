import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Palette,
  Wrench,
} from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import {
  useCategories,
  useCategory,
  useCategoryProducts,
  useProducts,
  useVendors,
} from '../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../lib/catalogMappers.ts';
import { resolveMediaUrl } from '../lib/media.ts';
import { isValidStoreSlug, storePath } from '../lib/storePath.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';

const CATEGORIES = {
  bedroom: {
    name: 'غرف النوم',
    img: '/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png',
    subcategories: ['أسرة', 'خزائن ملابس', 'تسريحات', 'طاولات جانبية', 'مراتب'],
  },
  'living-room': {
    name: 'الصالونات',
    img: '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png',
    subcategories: ['أطقم كنب', 'كراسي استرخاء', 'طاولات قهوة', 'طاولات تلفزيون', 'مكتبات'],
  },
  kitchen: {
    name: 'المطابخ',
    img: '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png',
    subcategories: ['خزائن مطابخ', 'طاولات طعام', 'كراسي طعام', 'عربات تقديم'],
  },
  office: {
    name: 'المكاتب',
    img: '/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png',
    subcategories: ['مكاتب إدارية', 'كراسي مكتبية', 'وحدات أدراج', 'مكتبات مكتبية'],
  },
  decor: {
    name: 'ديكورات',
    img: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png',
    subcategories: ['إضاءة', 'سجاد', 'لوحات جدارية', 'مرايا', 'نباتات زينة'],
  },
  'interior-design': {
    name: 'تصميم داخلي',
    img: '/categories/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%AF%D8%A7%D8%AE%D9%84%D9%8A.png',
    subcategories: ['تصميم سكني', 'تصميم تجاري', 'استشارات', 'مخططات معمارية'],
  },
  maintenance: {
    name: 'تركيب وصيانة',
    img: '/categories/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8%20%D9%88%D8%B5%D9%8A%D8%A7%D9%86%D8%A9.png',
    subcategories: ['تركيب أثاث', 'صيانة خشبية', 'تنجيد', 'دهانات'],
  },
  all: {
    name: 'التصنيفات',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200',
    subcategories: [],
  },
};

const PLACEHOLDER_CATEGORY_IMG =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200';

const CATEGORY_ICONS: Record<string, string> = {
  bedroom: '/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png',
  'living-room': '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png',
  kitchen: '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png',
  office: '/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png',
  decor: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png',
  'interior-design':
    '/categories/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%AF%D8%A7%D8%AE%D9%84%D9%8A.png',
  maintenance:
    '/categories/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8%20%D9%88%D8%B5%D9%8A%D8%A7%D9%86%D8%A9.png',
};

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'متوفر' },
  { value: 'out_of_stock', label: 'غير متوفر' },
  { value: 'preorder', label: 'طلب مسبق' },
] as const;

const MAX_PRICE = 20000;

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  key?: React.Key;
}

function Accordion({ title, children, defaultOpen = true }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between font-bold text-diyar-dark outline-none group"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 group-hover:text-diyar-brown ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

function CategoryAllProductsBrowse({
  searchParams,
  setSearchParams,
}: {
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}) {
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const sort = searchParams.get('sort') || '-created_at';
  const discounted = searchParams.get('discounted') === '1';

  const filters = useMemo(
    () => ({
      per_page: 12,
      page,
      sort,
      discounted: discounted || undefined,
    }),
    [page, sort, discounted],
  );

  const { data, isLoading, isError, error, refetch } = useProducts(filters);
  const products = data?.items.map(mapProductCard) ?? [];
  const pagination = data?.pagination;

  const sectionTitle = discounted
    ? 'عروض مميزة'
    : sort === '-popular'
      ? 'الأكثر تفاعلاً'
      : sort === '-created_at'
        ? 'وصل حديثاً'
        : 'جميع المنتجات';

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="bg-white border-b border-gray-200 pt-6 pb-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-right">
            <Link
              to="/category/all"
              className="text-sm text-diyar-brown hover:text-diyar-dark transition cursor-pointer"
            >
              ← جميع التصنيفات
            </Link>
            <h1 className="text-xl md:text-3xl font-bold text-diyar-dark mt-2">{sectionTitle}</h1>
          </div>
          <select
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set('sort', e.target.value);
              next.delete('page');
              setSearchParams(next, { replace: true });
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer"
          >
            <option value="-created_at">الأحدث</option>
            <option value="-popular">الأكثر تفاعلاً</option>
            <option value="-discount">أعلى خصم</option>
            <option value="price">السعر: الأقل</option>
            <option value="-price">السعر: الأعلى</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {isLoading ? (
          <LoadingState className="min-h-60" />
        ) : isError ? (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        ) : products.length === 0 ? (
          <EmptyState title="لا توجد منتجات" description="جرّب تغيير الفلاتر أو العودة لاحقاً." />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {pagination && (
              <PaginationBar
                pagination={pagination}
                page={page}
                onPageChange={(nextPage) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(nextPage));
                  setSearchParams(next, { replace: true });
                }}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CategoryAllLanding() {
  const { data: productCategories, isLoading: categoriesLoading } = useCategories('product');
  const { data: serviceCategories, isLoading: servicesLoading } = useCategories('service');
  const { data: vendorsData, isLoading: vendorsLoading } = useVendors({ per_page: 12 });

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="bg-white border-b border-gray-200 pt-6 pb-6 px-4">
        <div className="max-w-7xl mx-auto text-right">
          <h1 className="text-xl md:text-3xl font-bold text-diyar-dark mb-2">جميع التصنيفات</h1>
          <p className="text-gray-500 text-sm md:text-base">
            تصفح جميع أقسام المنتجات والخدمات التي تقدمها منصة ديار.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-diyar-dark">تصنيفات المنتجات</h2>
        {categoriesLoading ? (
          <LoadingState className="min-h-40 mb-16" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-16 md:mb-20">
            {(productCategories ?? []).map((cat) => (
              <Link
                to={`/category/${cat.slug}`}
                key={cat.id}
                className="flex flex-col items-center gap-3 md:gap-4 group cursor-pointer"
              >
                <div className="w-full aspect-4/3 rounded-3xl overflow-hidden relative shadow-sm border border-gray-100 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl bg-gray-100">
                  <img
                    src={CATEGORY_ICONS[cat.slug] ?? PLACEHOLDER_CATEGORY_IMG}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <span className="font-bold text-diyar-dark text-base md:text-xl group-hover:text-diyar-brown transition-colors text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-diyar-dark">المتاجر المعتمدة</h2>
          {vendorsLoading ? (
            <LoadingState className="min-h-24" />
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {(vendorsData?.items ?? [])
                .filter((vendor) => isValidStoreSlug(vendor.slug))
                .map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={storePath(vendor.slug)!}
                    className="min-w-30 md:min-w-40 aspect-square rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center p-4 snap-start hover:shadow-md transition group text-center"
                  >
                    {vendor.logo_url ? (
                      <img
                        src={resolveMediaUrl(vendor.logo_url) ?? ''}
                        alt={vendor.store_name}
                        className="w-14 h-14 rounded-full object-cover mb-2"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-diyar-cream/40 flex items-center justify-center mb-2 text-diyar-brown font-bold">
                        {vendor.store_name.charAt(0)}
                      </div>
                    )}
                    <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition line-clamp-2">
                      {vendor.store_name}
                    </span>
                    {vendor.product_count != null && (
                      <span className="text-xs text-gray-400 mt-1">
                        {vendor.product_count} منتج
                      </span>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </div>

        <div className="mb-16">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-diyar-dark">خدمات ديار</h2>
          {servicesLoading ? (
            <LoadingState className="min-h-24" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {(serviceCategories ?? []).slice(0, 6).map((service) => (
                <Link
                  key={service.id}
                  to={`/category/${service.slug}`}
                  className="bg-white rounded-3xl p-6 flex items-center gap-6 border border-gray-100 hover:shadow-lg hover:border-diyar-brown/30 transition group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-diyar-cream/30 flex items-center justify-center shrink-0">
                    {service.slug.includes('design') ? (
                      <Palette className="w-10 h-10 text-diyar-brown group-hover:scale-110 transition" />
                    ) : (
                      <Wrench className="w-10 h-10 text-diyar-brown group-hover:scale-110 transition" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-diyar-dark mb-1">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500">تصفح مقدمي الخدمة في هذا القسم.</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogFilterPanel({
  minPrice,
  maxPrice,
  vendorId,
  availabilityMode,
  vendors,
  isServiceCategory,
  onPatch,
  onReset,
}: {
  minPrice: number;
  maxPrice: number;
  vendorId?: string;
  availabilityMode?: string;
  vendors: Array<{ id: string; store_name: string }>;
  isServiceCategory: boolean;
  onPatch: (updates: Record<string, string | undefined>) => void;
  onReset: () => void;
}) {
  if (isServiceCategory) {
    return (
      <p className="text-sm text-gray-500">
        لا توجد منتجات خدمة في هذا القسم حالياً. التصنيفات متاحة للتصفح فقط.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <h3 className="font-bold text-lg text-diyar-dark flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-diyar-brown" />
          تصفية النتائج
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-diyar-brown font-medium hover:underline"
        >
          مسح الكل
        </button>
      </div>

      <Accordion title="نطاق السعر">
        <div className="px-1 space-y-4">
          <input
            type="range"
            min="0"
            max={String(MAX_PRICE)}
            step="100"
            value={maxPrice}
            onChange={(e) => onPatch({ max_price: e.target.value })}
            className="w-full accent-diyar-brown"
          />
          <div className="flex items-center justify-between gap-4">
            <label className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
              <span className="text-xs text-gray-500 block mb-1">من</span>
              <input
                type="number"
                min={0}
                max={maxPrice}
                value={minPrice}
                onChange={(e) => onPatch({ min_price: e.target.value || undefined })}
                className="w-full bg-transparent text-center font-bold text-sm outline-none"
              />
            </label>
            <label className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
              <span className="text-xs text-gray-500 block mb-1">إلى</span>
              <input
                type="number"
                min={minPrice}
                max={MAX_PRICE}
                value={maxPrice}
                onChange={(e) => onPatch({ max_price: e.target.value || undefined })}
                className="w-full bg-transparent text-center font-bold text-sm outline-none"
              />
            </label>
          </div>
        </div>
      </Accordion>

      <Accordion title="المتاجر المعتمدة">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pl-3">
          {vendors.map((vendor) => (
            <label key={vendor.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="vendor_id"
                checked={vendorId === vendor.id}
                onChange={() =>
                  onPatch({ vendor_id: vendorId === vendor.id ? undefined : vendor.id })
                }
                className="accent-diyar-brown"
              />
              <span className="text-sm text-gray-600 group-hover:text-diyar-dark transition-colors">
                {vendor.store_name}
              </span>
            </label>
          ))}
        </div>
      </Accordion>

      <Accordion title="التوفر">
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="availability_mode"
                checked={availabilityMode === option.value}
                onChange={() =>
                  onPatch({
                    availability_mode: availabilityMode === option.value ? undefined : option.value,
                  })
                }
                className="accent-diyar-brown"
              />
              <span className="text-sm text-gray-600 group-hover:text-diyar-dark transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </Accordion>
    </>
  );
}

export default function CategoryPage() {
  const { id } = useParams();
  const slug = id ?? 'all';
  const staticMeta = CATEGORIES[slug as keyof typeof CATEGORIES];
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState('الكل');

  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const sort = searchParams.get('sort') || '-created_at';
  const vendorId = searchParams.get('vendor_id') || undefined;
  const availabilityMode = searchParams.get('availability_mode') || undefined;
  const minPrice = Number(searchParams.get('min_price') || '0');
  const maxPrice = Number(searchParams.get('max_price') || String(MAX_PRICE));

  const patchParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      if (resetPage) {
        next.delete('page');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const filters = useMemo(
    () => ({
      min_price: minPrice > 0 ? minPrice : undefined,
      max_price: maxPrice < MAX_PRICE ? maxPrice : undefined,
      vendor_id: vendorId,
      availability_mode: availabilityMode as 'in_stock' | 'out_of_stock' | 'preorder' | undefined,
      per_page: 12,
      page,
      sort,
    }),
    [minPrice, maxPrice, vendorId, availabilityMode, page, sort],
  );

  const { data: apiCategory } = useCategory(slug);
  const { data: vendorsData } = useVendors({ per_page: 50 });
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCategoryProducts(slug, filters);

  const categoryName = apiCategory?.name ?? staticMeta?.name ?? slug;
  const categoryImg = CATEGORY_ICONS[slug] ?? staticMeta?.img ?? PLACEHOLDER_CATEGORY_IMG;
  const subcategories = staticMeta && 'subcategories' in staticMeta ? staticMeta.subcategories : [];
  const isServiceCategory = apiCategory?.type === 'service';
  const products = productsData?.items.map(mapProductCard) ?? [];
  const totalResults = productsData?.pagination.total ?? products.length;
  const vendors = vendorsData?.items ?? [];
  const hasActiveFilters =
    minPrice > 0 ||
    maxPrice < MAX_PRICE ||
    Boolean(vendorId) ||
    Boolean(availabilityMode) ||
    sort !== '-created_at';

  if (slug === 'all') {
    const browseSort = searchParams.get('sort');
    const browseDiscounted = searchParams.get('discounted');
    if (browseSort || browseDiscounted) {
      return (
        <CategoryAllProductsBrowse searchParams={searchParams} setSearchParams={setSearchParams} />
      );
    }
    return <CategoryAllLanding />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200 pt-4 pb-4 md:pt-6 md:pb-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-row items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 shadow-sm border border-gray-100">
            <img src={categoryImg} alt={categoryName} className="w-full h-full object-cover" />
          </div>
          <div className="text-right flex-1">
            <h1 className="text-xl md:text-4xl font-bold text-diyar-dark mb-1 md:mb-2">
              {categoryName}
            </h1>
            <p className="text-gray-500 max-w-2xl text-xs md:text-base leading-relaxed line-clamp-2 md:line-clamp-none">
              تصفح أحدث وأرقى المنتجات في قسم {categoryName}. نقدم لك تشكيلة واسعة من أعرق المتاجر.
            </p>
          </div>
        </div>
      </div>

      {/* Subcategories (only if it has subcategories) */}
      {subcategories.length > 0 && (
        <div className="bg-white border-b border-gray-100 shadow-sm relative z-10 w-full mb-6">
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
            <p className="text-[11px] text-gray-400 mb-2 px-1">
              معاينة بصرية فقط — الفلاتر الفرعية لا تؤثر على نتائج البحث حالياً
            </p>
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                aria-disabled="true"
                title="معاينة بصرية — لا يفلتر النتائج"
                onClick={() => setActiveSubcategory('الكل')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold shadow-sm shrink-0 transition-colors cursor-default ${
                  activeSubcategory === 'الكل'
                    ? 'bg-diyar-dark text-white'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                الكل
              </button>
              {subcategories.map((sub: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  aria-disabled="true"
                  title="معاينة بصرية — لا يفلتر النتائج"
                  onClick={() => setActiveSubcategory(sub)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors shrink-0 cursor-default ${
                    activeSubcategory === sub
                      ? 'bg-diyar-dark text-white border-diyar-dark font-bold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block w-72 shrink-0 bg-white border border-gray-200 rounded-3xl p-6 self-start">
          <CatalogFilterPanel
            minPrice={minPrice}
            maxPrice={maxPrice}
            vendorId={vendorId}
            availabilityMode={availabilityMode}
            vendors={vendors}
            isServiceCategory={isServiceCategory}
            onPatch={patchParams}
            onReset={resetFilters}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-2 bg-gray-100 text-diyar-dark px-4 py-2 rounded-xl text-sm font-bold"
              >
                <Filter size={18} />
                تصفية
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="hidden md:inline font-medium">
                إظهار {products.length} من أصل {totalResults} نتيجة
              </span>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50">
                <span className="text-gray-500">ترتيب حسب:</span>
                <select
                  value={sort}
                  onChange={(e) => patchParams({ sort: e.target.value })}
                  className="bg-transparent border-none outline-none font-bold text-diyar-dark pr-1 pl-4 cursor-pointer"
                >
                  <option value="-created_at">الأحدث</option>
                  <option value="price">السعر: من الأقل للأعلى</option>
                  <option value="-price">السعر: من الأعلى للأقل</option>
                  <option value="-discount">أعلى خصم</option>
                  <option value="name">الاسم</option>
                </select>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(minPrice > 0 || maxPrice < MAX_PRICE) && (
                <span className="bg-diyar-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                  السعر: {minPrice} - {maxPrice}
                  <button
                    type="button"
                    aria-label="إزالة فلتر السعر"
                    onClick={() => patchParams({ min_price: undefined, max_price: undefined })}
                  >
                    <X size={14} className="cursor-pointer hover:text-gray-300" />
                  </button>
                </span>
              )}
              {vendorId && (
                <span className="bg-diyar-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                  {vendors.find((v) => v.id === vendorId)?.store_name ?? 'متجر'}
                  <button
                    type="button"
                    aria-label="إزالة فلتر المتجر"
                    onClick={() => patchParams({ vendor_id: undefined })}
                  >
                    <X size={14} className="cursor-pointer hover:text-gray-300" />
                  </button>
                </span>
              )}
              {availabilityMode && (
                <span className="bg-diyar-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                  {AVAILABILITY_OPTIONS.find((o) => o.value === availabilityMode)?.label}
                  <button
                    type="button"
                    aria-label="إزالة فلتر التوفر"
                    onClick={() => patchParams({ availability_mode: undefined })}
                  >
                    <X size={14} className="cursor-pointer hover:text-gray-300" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-diyar-brown font-medium cursor-pointer flex items-center px-2 hover:underline"
              >
                مسح فلاتر البحث
              </button>
            </div>
          )}

          {/* Product/Service Grid */}
          {isLoading ? (
            <LoadingState className="min-h-60" />
          ) : isError ? (
            <ErrorState error={error as Error} onRetry={() => refetch()} />
          ) : isServiceCategory ? (
            <EmptyState title="لا توجد خدمات" description="سيتم إضافة خدمات هذا القسم قريباً." />
          ) : products.length === 0 ? (
            <EmptyState
              title="لا توجد منتجات"
              description="لم يتم العثور على منتجات في هذا القسم حالياً."
            />
          ) : (
            <div
              className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
            >
              {products.map((item) => (
                <div key={item.id} className="h-full">
                  <ProductCard product={item} layout={viewMode} />
                </div>
              ))}
            </div>
          )}

          {productsData?.pagination && (
            <PaginationBar
              pagination={productsData.pagination}
              page={page}
              onPageChange={(nextPage) => patchParams({ page: String(nextPage) }, false)}
              className="mt-12"
            />
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-diyar-dark">تصفية النتائج</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-diyar-dark"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <CatalogFilterPanel
                minPrice={minPrice}
                maxPrice={maxPrice}
                vendorId={vendorId}
                availabilityMode={availabilityMode}
                vendors={vendors}
                isServiceCategory={isServiceCategory}
                onPatch={patchParams}
                onReset={resetFilters}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl"
              >
                مسح الكل
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-2 bg-diyar-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-black/10"
              >
                عرض النتائج ({totalResults})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
