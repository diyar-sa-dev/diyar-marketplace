import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Filter,
  Wrench,
  LayoutDashboard,
  Plus,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { RequestServiceModal } from '../components/modals/RequestServiceModal.tsx';
import { ServiceRequestListCard } from '../components/services/ServiceRequestListCard.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { useServiceRequests } from '../hooks/services/useServiceRequests.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useServiceCategories, useServices } from '../hooks/services/useServices.ts';
import type { ServiceListFilters } from '../types/services.ts';
import { serviceCategoryIcon, SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<ServiceListFilters['sort']>('latest');
  const [page, setPage] = useState(1);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: myRequestsData, isLoading: myRequestsLoading } = useServiceRequests(
    1,
    'all',
    3,
    isAuthenticated,
  );

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      category: selectedCategory ?? undefined,
      sort,
      page,
      per_page: 12,
    }),
    [debouncedSearch, selectedCategory, sort, page],
  );

  const { data, isLoading, isFetching, isError } = useServices(filters);
  const services = data?.items ?? [];
  const pagination = data?.pagination;
  const myRequests = myRequestsData?.items ?? [];

  const categoryLabel = (nameAr: string, nameEn: string) => (locale === 'ar' ? nameAr : nameEn);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-diyar-dark mb-3">
              الخدمات المتخصصة
            </h1>
            <p className="text-gray-600 max-w-2xl text-sm md:text-base">
              اكتشف مجموعة واسعة من الخدمات التي يقدمها أفضل الخبراء والمختصين. من التصميم الداخلي
              إلى التركيب والصيانة، كل ما تحتاجه لتجهيز مساحتك بكل سهولة وموثوقية.
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="shrink-0 bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={20} />
            طلب تنفيذ مخصص
          </button>
        </div>

        {isAuthenticated && (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-diyar-dark">طلباتك الأخيرة</h2>
              <Link
                to="/profile/service-requests"
                className="text-sm font-bold text-diyar-brown hover:text-diyar-dark transition-colors cursor-pointer"
              >
                عرض الكل
              </Link>
            </div>
            {myRequestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-diyar-brown" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                <p className="text-gray-500 text-sm mb-3">لم تقدّم أي طلب تنفيذ بعد.</p>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-diyar-brown text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#8A6D46] transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                  ابدأ طلباً مخصصاً
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((item) => (
                  <ServiceRequestListCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    compact
                    onClick={() =>
                      navigate(`/profile/service-requests?id=${encodeURIComponent(item.id)}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex overflow-x-auto snap-x gap-4 mb-8 pb-4 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setPage(1);
            }}
            className={`flex-none min-w-30 sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center cursor-pointer ${
              selectedCategory === null
                ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
            }`}
          >
            <LayoutDashboard
              className={`w-8 h-8 mb-3 ${selectedCategory === null ? 'text-white' : 'text-diyar-brown'}`}
            />
            <span className="font-bold text-sm">الكل</span>
          </button>

          {categoriesLoading &&
            [...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex-none min-w-30 sm:flex-1 h-30 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}

          {!categoriesLoading &&
            categories.map((category) => {
              const Icon = serviceCategoryIcon(category.icon_key);
              const label = categoryLabel(category.name_ar, category.name_en);
              const isActive = selectedCategory === category.slug;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    setPage(1);
                  }}
                  className={`flex-none min-w-30 sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center cursor-pointer ${
                    isActive
                      ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                      : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 mb-3 ${isActive ? 'text-white' : 'text-diyar-brown'}`}
                  />
                  <span className="font-bold text-sm text-center">{label}</span>
                </button>
              );
            })}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن خدمة أو مقدم خدمة..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
          <div className="relative md:w-52 shrink-0">
            <select
              value={sort ?? 'latest'}
              onChange={(event) => {
                setSort(event.target.value as ServiceListFilters['sort']);
                setPage(1);
              }}
              className="w-full appearance-none bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-diyar-brown outline-none cursor-pointer"
            >
              <option value="latest">الأحدث</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="most_requested">الأكثر طلباً</option>
              <option value="price_asc">السعر: من الأقل</option>
              <option value="price_desc">السعر: من الأعلى</option>
            </select>
            <Filter
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {(isLoading || isFetching) && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-center py-20">
            <p className="text-red-500 font-medium">تعذر تحميل الخدمات. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <Link
                  to={`/service/${service.slug}`}
                  key={service.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={service.image_url || SERVICE_IMAGE_FALLBACK}
                      alt={service.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                      }}
                    />
                    {service.delivery_type_label && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-diyar-dark shadow-sm">
                        {service.delivery_type_label}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-diyar-dark line-clamp-2 leading-snug group-hover:text-diyar-brown transition-colors">
                        {service.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 text-gray-500">
                        <User size={12} />
                      </div>
                      <span className="line-clamp-1">{service.provider?.display_name}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">السعر التقريبي</span>
                        <div className="font-bold text-lg text-diyar-dark">
                          {service.pricing_label ||
                            (service.starting_price != null
                              ? `${service.starting_price} ${service.currency}`
                              : '—')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-700">{service.rating_average}</span>
                        <span className="text-yellow-600/60">({service.reviews_count})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-20">
                <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">لم يتم العثور على خدمات تطابق بحثك</p>
              </div>
            )}

            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="text-sm text-gray-600">
                  صفحة {pagination.current_page} من {pagination.last_page}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((current) => current + 1)}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <RequestServiceModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
