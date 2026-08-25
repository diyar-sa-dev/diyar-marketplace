import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Building2,
  Briefcase,
  Factory,
  Plus,
  BadgeCheck,
} from 'lucide-react';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { useB2bCategories } from '../hooks/b2b/useB2bCategories.ts';
import { useB2bCompanies } from '../hooks/b2b/useB2bCompanies.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { usePaginationState, paginationBarProps } from '../hooks/usePaginationState.ts';
import type { B2bCategory, B2bCompanyCard } from '../types/b2b.ts';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600';

const categoryIcon = (slug: string | undefined, size = 14) => {
  if (slug === 'furniture-manufacturing') return <Factory size={size} />;
  if (slug === 'interior-design') return <Briefcase size={size} />;
  return <Building2 size={size} />;
};

function CompanyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse flex flex-col">
      <div className="h-40 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4 mt-6" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-10 bg-gray-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: B2bCompanyCard }) {
  const categoryName = company.category?.name ?? '';
  const logo =
    company.logo ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=F3ECDB&color=947961&size=100`;

  return (
            <div
              key={company.slug}
              data-testid={`b2b-company-card-${company.slug}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
      <div className="h-40 relative overflow-hidden bg-gray-100">
        <img
          src={company.cover_image ?? FALLBACK_COVER}
          alt={company.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_COVER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {categoryName ? (
          <div className="absolute bottom-4 left-4 bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-diyar-dark flex items-center gap-1 shadow">
            {categoryIcon(company.category?.slug)}
            {categoryName}
          </div>
        ) : null}
      </div>

      <div className="p-5 relative flex-1 flex flex-col">
        <div className="w-16 h-16 rounded-xl bg-white shadow-md border border-gray-100 absolute -top-8 right-5 overflow-hidden flex items-center justify-center p-1">
          <img src={logo} alt={company.name} className="w-full h-full object-contain rounded-lg" loading="lazy" />
        </div>

        <div className="mt-8 flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-lg text-diyar-dark line-clamp-1 flex items-center gap-1.5">
            {company.name}
            {company.verified ? (
              <BadgeCheck size={16} className="text-diyar-brown shrink-0" aria-label="موثّقة" />
            ) : null}
          </h3>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-xs shrink-0">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="font-bold text-diyar-dark">{company.rating.toFixed(1)}</span>
            <span className="text-gray-400">({company.reviews_count})</span>
          </div>
        </div>

        {company.location ? (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <MapPin size={14} className="text-diyar-brown" />
            <span>{company.location}</span>
          </div>
        ) : null}

        {company.description ? (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{company.description}</p>
        ) : null}

        {company.tags && company.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-6">
            {company.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-md border border-gray-100"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="mb-6" />
        )}

        <div className="mt-auto pt-4 border-t border-gray-50">
          <Link
            to={`/b2b/${company.slug}`}
            className="block w-full text-center bg-diyar-cream/20 text-diyar-brown border border-diyar-brown hover:bg-diyar-brown hover:text-white py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            زيارة ملف الشركة
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function B2BPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = usePaginationState({ initialPerPage: 12 });
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const selectedCategory = searchParams.get('category') ?? '';
  const q = searchParams.get('q')?.trim() || undefined;

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = searchParams.get('q') ?? '';
    if (trimmed === current) return;

    const next = new URLSearchParams(searchParams);
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    pagination.resetPage();
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters = useMemo(
    () => ({
      page: pagination.page,
      per_page: pagination.perPage,
      category: selectedCategory || undefined,
      q,
      sort: 'featured' as const,
    }),
    [pagination.page, pagination.perPage, selectedCategory, q],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useB2bCompanies(filters);
  const { data: categories } = useB2bCategories();

  const filterableCategories = useMemo(
    () => (categories ?? []).filter((c: B2bCategory) => (c.published_companies_count ?? 0) > 0),
    [categories],
  );

  const stats = [
    {
      value: `${data?.stats.verified_companies ?? 0}+`,
      label: 'شركة موثّقة',
    },
    {
      value: `${data?.stats.published_companies ?? 0}+`,
      label: 'شركة في الدليل',
    },
    { value: '١٢٠٠+', label: 'صفقة ناجحة' },
  ];

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('category', slug);
    else next.delete('category');
    pagination.resetPage();
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="relative w-full min-h-[300px] md:min-h-[360px] flex items-end overflow-hidden mb-8">
        <img
          src={HERO_IMAGE}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/hero_2.jpg';
          }}
        />
        <div className="absolute inset-0 bg-diyar-dark/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark via-diyar-dark/75 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 text-white">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-diyar-cream text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Building2 size={14} /> حلول الأعمال والجملة
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-snug drop-shadow-sm" data-testid="b2b-page-title">
            بوابة الأعمال (B2B)
          </h1>
          <p className="text-white/80 max-w-2xl text-sm md:text-lg leading-relaxed mb-6">
            دليلك الشامل لأفضل المصانع، شركات التصميم، وموردي المواد الخام. تواصل مباشرة مع شركاء
            النجاح واطلب عروض أسعار لمشاريعك.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-diyar-cream text-diyar-dark font-bold text-sm px-5 py-3 rounded-xl hover:bg-white transition-colors shadow-lg cursor-pointer"
            >
              <Plus size={18} /> سجّل شركتك
            </button>
            <div className="flex flex-wrap gap-2">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 text-center"
                >
                  <div className="font-bold text-lg leading-none">{s.value}</div>
                  <div className="text-[11px] text-white/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن شركة، مصنع، أو تخصص..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${!selectedCategory ? 'bg-diyar-brown text-white border-diyar-brown shadow-sm shadow-diyar-brown/20' : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown/40 hover:text-diyar-dark'}`}
            >
              الكل
            </button>
            {filterableCategories.map((type) => {
              const active = selectedCategory === type.slug;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setCategory(type.slug)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${active ? 'bg-diyar-brown text-white border-diyar-brown shadow-sm shadow-diyar-brown/20' : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown/40 hover:text-diyar-dark'}`}
                >
                  {categoryIcon(type.slug)}
                  {type.name}
                </button>
              );
            })}
          </div>
          <span className="text-sm text-gray-400 font-medium shrink-0">
            {data?.pagination.total ?? 0} شركة
            {isFetching && !isPending ? ' …' : ''}
          </span>
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CompanyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map((company) => (
                <CompanyCard key={company.slug} company={company} />
              ))}
            </div>

            {data && data.items.length === 0 ? (
              <div className="text-center py-20">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">لم يتم العثور على شركات تطابق بحثك</p>
              </div>
            ) : null}

            {data && data.pagination.last_page > 1 ? (
              <div className="mt-10">
                <PaginationBar
                  {...paginationBarProps(data.pagination, pagination, { isLoading: isFetching })}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
