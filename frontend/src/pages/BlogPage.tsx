import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { BlogArticleCardLink } from '../components/blog/BlogArticleCardLink.tsx';
import { useBlogArticles } from '../hooks/blog/useBlogArticles.ts';
import { useBlogCategories } from '../hooks/blog/useBlogCategories.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePaginationState, paginationBarProps } from '../hooks/usePaginationState.ts';

export default function BlogPage() {
  const { tagSlug } = useParams<{ tagSlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale, dir } = useLocale();
  const pagination = usePaginationState({ initialPerPage: 12 });
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const BreadcrumbChevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const category = searchParams.get('category') ?? undefined;
  const q = searchParams.get('q')?.trim() || undefined;

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = searchParams.get('q') ?? '';
    if (trimmed === current) return;

    const next = new URLSearchParams(searchParams);
    if (trimmed) {
      next.set('q', trimmed);
    } else {
      next.delete('q');
    }
    pagination.resetPage();
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync debounced search to URL only
  }, [debouncedSearch]);

  const filters = useMemo(
    () => ({
      page: pagination.page,
      per_page: pagination.perPage,
      category,
      tag: tagSlug,
      q,
    }),
    [pagination.page, pagination.perPage, category, tagSlug, q],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useBlogArticles(filters);
  const { data: categories } = useBlogCategories();

  const filterableCategories = useMemo(
    () => (categories ?? []).filter((item) => (item.published_articles_count ?? 0) > 0),
    [categories],
  );

  const articles = data?.items ?? [];
  const showEmpty = !isPending && !isError && articles.length === 0;
  const isSearching = isFetching && !isPending;

  const setCategoryFilter = (nextCategory: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextCategory) {
      next.set('category', nextCategory);
    } else {
      next.delete('category');
    }
    pagination.resetPage();
    setSearchParams(next);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 font-sans" dir={dir}>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('layout.nav.home')}
            </Link>
            <BreadcrumbChevron size={16} />
            <span className="font-bold text-diyar-dark">{t('home.blog.badge')}</span>
            {tagSlug ? (
              <>
                <BreadcrumbChevron size={16} />
                <span className="font-bold text-diyar-brown">#{tagSlug}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-diyar-brown text-sm font-bold mb-2 block">{t('home.blog.badge')}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-diyar-dark">{t('home.blog.title')}</h1>
            {tagSlug ? (
              <p className="mt-2 text-sm text-gray-500">{t('blog.tagFilterHint', { tag: tagSlug })}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 inset-s-3 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('blog.searchPlaceholder')}
              aria-label={t('blog.searchPlaceholder')}
              className="w-full rounded-2xl border border-gray-200 bg-white ps-10 pe-4 py-3 text-sm outline-none focus:border-diyar-brown transition-colors"
            />
            {isSearching ? (
              <span className="absolute top-1/2 -translate-y-1/2 inset-e-3 h-2 w-2 rounded-full bg-diyar-brown animate-pulse" />
            ) : null}
          </div>

          <select
            value={category ?? ''}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-diyar-brown lg:min-w-55 transition-colors"
          >
            <option value="">{t('blog.allCategories')}</option>
            {filterableCategories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
                {item.published_articles_count
                  ? ` (${item.published_articles_count})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {filterableCategories.length > 0 ? (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('')}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                !category
                  ? 'bg-diyar-dark text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-diyar-brown'
              }`}
            >
              {t('blog.allCategories')}
            </button>
            {filterableCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryFilter(item.slug)}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  category === item.slug
                    ? 'bg-diyar-dark text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-diyar-brown'
                }`}
              >
                {item.name}
                {item.published_articles_count ? (
                  <span className="ms-1.5 opacity-70">({item.published_articles_count})</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-3xl border border-gray-100 overflow-hidden bg-white">
                <div className="h-48 bg-gray-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
                  <div className="h-5 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-4/5 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} title={t('blog.loadError')} />
        ) : showEmpty ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <h2 className="text-xl font-bold text-diyar-dark mb-2">{t('blog.emptyTitle')}</h2>
            <p className="text-sm text-gray-500">{t('blog.emptyDescription')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <BlogArticleCardLink key={article.id} article={article} locale={locale} />
              ))}
            </div>

            {data?.pagination ? (
              <PaginationBar
                {...paginationBarProps(data.pagination, pagination, {
                  isLoading: isPending,
                  className: 'mt-10',
                })}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
