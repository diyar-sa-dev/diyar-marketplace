import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Award,
  ShieldCheck,
  Share2,
  Mail,
  Phone,
  Globe,
  LayoutGrid,
  Info,
  Clock,
  Truck,
  X,
  UserCheck,
} from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { useVendor, useVendorProducts } from '../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../lib/catalogMappers.ts';
import { resolveMediaUrl } from '../lib/media.ts';
import { formatTimeRange } from '../lib/formatTimeRange.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { isApiErrorDetail, isNotFound, parseApiError } from '../utils/errors.ts';
import { isValidStoreSlug } from '../lib/storePath.ts';
import { StoreReviewsTab } from '../components/store/StoreReviewsTab.tsx';
import { ProductShareSheet } from '../components/product/ProductShareSheet.tsx';
import { StarRating } from '../components/product/StarRating.tsx';
import { useLocale } from '../hooks/useLocale.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useStoreFollow } from '../hooks/store/useStoreFollow.ts';
import { useToast } from '../hooks/useToast.ts';

import { PLACEHOLDER_STORE_COVER, PLACEHOLDER_STORE_LOGO } from '../lib/storeMediaDefaults.ts';

export default function StorePage() {
  const { t, locale, dir } = useLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const slug = isValidStoreSlug(id) ? id : undefined;
  const { follow, unfollow } = useStoreFollow(slug);
  const [activeTab, setActiveTab] = useState('products');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-created_at');

  const {
    data: vendor,
    isLoading: vendorLoading,
    isError: vendorError,
    error: vendorErr,
    refetch: refetchVendor,
  } = useVendor(slug);
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErr,
    refetch: refetchProducts,
  } = useVendorProducts(slug, { per_page: 12, page, sort });

  if (!isValidStoreSlug(id)) {
    return (
      <div className="bg-gray-50 min-h-screen pb-16 pt-8">
        <EmptyState title="المتجر غير موجود" description="لم نتمكن من العثور على هذا المتجر." />
      </div>
    );
  }

  if (vendorLoading) {
    return (
      <div className="bg-gray-50 min-h-screen pb-16 pt-8">
        <LoadingState className="min-h-80" />
      </div>
    );
  }

  if (vendorError) {
    if (isApiErrorDetail(vendorErr) && isNotFound(vendorErr)) {
      return (
        <div className="bg-gray-50 min-h-screen pb-16 pt-8">
          <EmptyState title="المتجر غير موجود" description="لم نتمكن من العثور على هذا المتجر." />
        </div>
      );
    }
    return (
      <div className="bg-gray-50 min-h-screen pb-16 pt-8">
        <ErrorState error={vendorErr as Error} onRetry={() => refetchVendor()} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-gray-50 min-h-screen pb-16 pt-8">
        <EmptyState title="المتجر غير موجود" description="لم نتمكن من العثور على هذا المتجر." />
      </div>
    );
  }

  const canonicalSlug = vendor.slug;
  if (canonicalSlug && slug !== canonicalSlug) {
    return <Navigate to={`/store/${canonicalSlug}`} replace />;
  }

  const storeSlug = canonicalSlug ?? slug;
  const coverUrl = resolveMediaUrl(vendor.cover_url) ?? PLACEHOLDER_STORE_COVER;
  const logoUrl = resolveMediaUrl(vendor.logo_url) ?? PLACEHOLDER_STORE_LOGO;
  const products = productsData?.items.map(mapProductCard) ?? [];
  const productsCount = vendor.products_count ?? productsData?.pagination.total ?? products.length;

  const isOwnStore = Boolean(vendor.is_own_store);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error(t('store.followLoginRequired'));
      return;
    }

    if (isOwnStore) {
      toast.warning(t('store.followOwnStore'));
      return;
    }

    try {
      if (vendor.is_following) {
        await unfollow.mutateAsync();
        toast.success(t('store.unfollowed'));
      } else {
        await follow.mutateAsync();
        toast.success(t('store.followed'));
      }
      await refetchVendor();
    } catch (error) {
      const message = parseApiError(error, locale).message;
      if (message.includes('متابعة متجرك') || message.toLowerCase().includes('follow your own')) {
        toast.warning(t('store.followOwnStore'));
      } else {
        toast.error(t('store.followError'));
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Image */}
      <div
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => setIsGalleryOpen(true)}
      >
        <img
          src={coverUrl}
          alt={vendor.store_name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
            title={t('store.share')}
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store Profile Header */}
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl md:rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-16 md:-mt-20">
              <img
                src={logoUrl}
                alt={vendor.store_name}
                className="w-full h-full object-cover bg-white"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200';
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1
                  className="text-2xl md:text-3xl font-bold text-diyar-dark wrap-break-word line-clamp-2 max-w-full"
                  title={vendor.store_name}
                >
                  {vendor.store_name}
                </h1>
                <ShieldCheck className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                {vendor.description ?? 'متجر معتمد على منصة ديار.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-gray-600">
                {vendor.location && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <MapPin className="w-4 h-4 text-diyar-brown" />
                    <span>{vendor.location}</span>
                  </div>
                )}
                {(vendor.reviews_count ?? 0) > 0 && vendor.rating_avg != null && (
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <StarRating value={vendor.rating_avg} readOnly size={14} />
                    <span className="font-bold text-diyar-dark tabular-nums">
                      {vendor.rating_avg.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      {t('storeReviews.overallRatingCount', { count: vendor.reviews_count ?? 0 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 md:w-auto w-full">
              {!isOwnStore ? (
                <button
                  type="button"
                  onClick={() => void handleFollowToggle()}
                  disabled={follow.isPending || unfollow.isPending}
                  className={`flex-1 md:flex-none font-bold py-2.5 px-8 rounded-xl transition shadow-md disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2 ${
                    vendor.is_following
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 hover:bg-emerald-700'
                      : 'bg-diyar-brown text-white hover:bg-[#856b54]'
                  }`}
                >
                  {vendor.is_following ? <UserCheck size={18} /> : null}
                  {vendor.is_following ? t('store.following') : t('store.follow')}
                </button>
              ) : null}
              <button
                type="button"
                disabled
                title={t('store.contactSoon')}
                className="flex-1 md:flex-none bg-gray-100 text-gray-400 font-bold py-2.5 px-6 rounded-xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Mail size={18} />
                {t('store.contact')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">{t('store.statsTitle')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">{t('store.statsProducts')}</span>
                  <span className="font-bold text-diyar-dark">
                    {t('store.productsCount', { count: productsCount })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">{t('store.statsFollowers')}</span>
                  <span className="font-bold text-diyar-dark tabular-nums">
                    {t('store.followersCount', { count: vendor.followers_count ?? 0 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">{t('store.statsLocation')}</span>
                  <span className="font-bold text-diyar-dark">{vendor.location ?? '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">مميزات المتجر</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-gray-700 font-medium">متجر موثوق ومعتمد من ديار</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-gray-700 font-medium">شحن سريع داخل المملكة</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-gray-700 font-medium">ضمان الجودة وسياسة استرجاع مرنة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 mb-6 font-medium text-sm md:text-base scrollbar-hide -mx-1 px-1">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`py-3 px-4 sm:px-6 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold'
                    : 'text-gray-500 hover:text-diyar-dark'
                }`}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <LayoutGrid size={18} />
                  المنتجات
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`py-3 px-4 sm:px-6 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'about'
                    ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold'
                    : 'text-gray-500 hover:text-diyar-dark'
                }`}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Info size={18} />
                  عن المتجر
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-4 sm:px-6 shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold'
                    : 'text-gray-500 hover:text-diyar-dark'
                }`}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Star size={18} />
                  التقييمات
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-diyar-dark">جميع المنتجات</h2>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      setPage(1);
                    }}
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-4 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
                  >
                    <option value="-created_at">الأحدث</option>
                    <option value="popular">الأكثر شعبية</option>
                    <option value="price">السعر: من الأقل للأعلى</option>
                    <option value="-price">السعر: من الأعلى للأقل</option>
                  </select>
                </div>

                {productsLoading ? (
                  <LoadingState className="min-h-50" />
                ) : productsError ? (
                  <ErrorState error={productsErr as Error} onRetry={() => refetchProducts()} />
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                      {products.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                    {productsData?.pagination && (
                      <PaginationBar
                        pagination={productsData.pagination}
                        page={page}
                        onPageChange={setPage}
                        className="mt-10"
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد منتجات</h3>
                    <p className="text-gray-400">هذا المتجر لم يقم بإضافة أي منتجات حتى الآن.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-diyar-dark mb-4">{t('store.aboutTitle')}</h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {vendor.description ?? t('store.defaultDescription')}
                </p>

                {(vendor.support_phone || vendor.support_email || vendor.website_url) && (
                  <>
                    <h3 className="font-bold text-lg text-diyar-dark mb-4">
                      {t('vendor.settings.store.contactTitle')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                      {vendor.support_phone && (
                        <a
                          href={`tel:${vendor.support_phone}`}
                          className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-diyar-brown/30 transition"
                          dir="ltr"
                        >
                          <Phone size={18} className="text-diyar-brown shrink-0" />
                          <span className="font-medium text-diyar-dark">{vendor.support_phone}</span>
                        </a>
                      )}
                      {vendor.support_email && (
                        <a
                          href={`mailto:${vendor.support_email}`}
                          className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-diyar-brown/30 transition"
                          dir="ltr"
                        >
                          <Mail size={18} className="text-diyar-brown shrink-0" />
                          <span className="font-medium text-diyar-dark truncate">{vendor.support_email}</span>
                        </a>
                      )}
                      {vendor.website_url && (
                        <a
                          href={vendor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-diyar-brown/30 transition sm:col-span-2"
                          dir="ltr"
                        >
                          <Globe size={18} className="text-diyar-brown shrink-0" />
                          <span className="font-medium text-diyar-brown truncate">{vendor.website_url}</span>
                        </a>
                      )}
                    </div>
                  </>
                )}

                {(vendor.working_hours?.length ?? 0) > 0 && (
                  <>
                    <h3 className="font-bold text-lg text-diyar-dark mb-4">{t('store.workingHours')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
                      {vendor.working_hours?.map((hour) => (
                        <div
                          key={hour.day}
                          className={`rounded-xl border p-4 text-start ${
                            hour.is_closed
                              ? 'border-gray-100 bg-gray-50 text-gray-400'
                              : 'border-diyar-brown/15 bg-amber-50/30'
                          }`}
                          dir={dir}
                        >
                          <p className="font-bold text-sm text-diyar-dark mb-1">
                            {t(`vendor.settings.weekdays.${hour.day}`)}
                          </p>
                          {hour.is_closed ? (
                            <p className="text-sm">{t('store.closed')}</p>
                          ) : (
                            <p
                              className="text-sm tabular-nums text-gray-600 [unicode-bidi:isolate]"
                              dir="ltr"
                            >
                              {formatTimeRange(hour.opens_at, hour.closes_at, locale)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="font-bold text-lg text-diyar-dark mb-4">{t('store.policyTitle')}</h3>
                {(vendor.return_policy_summary?.length ?? 0) > 0 ||
                (vendor.shipping_summary?.length ?? 0) > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {vendor.return_policy_summary?.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                    {vendor.shipping_summary?.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">{t('store.noPolicyConfigured')}</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && storeSlug ? (
              <StoreReviewsTab
                slug={storeSlug}
                storeName={vendor.store_name}
                storeLogoUrl={vendor.logo_url}
              />
            ) : null}
          </div>
        </div>
      </div>
      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-200 flex flex-col justify-center animate-in fade-in duration-300 p-4">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full"
          >
            <X size={24} />
          </button>

          <div className="relative w-full max-w-5xl mx-auto">
            <div className="aspect-4/3 md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
              <img
                src={coverUrl}
                alt="Store Cover"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=800';
                }}
              />
            </div>
          </div>
        </div>
      )}
      <ProductShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={storeSlug ? `${window.location.origin}/store/${storeSlug}` : window.location.href}
        title={vendor.store_name}
        context="store"
      />
    </div>
  );
}
