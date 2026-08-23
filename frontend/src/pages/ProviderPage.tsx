import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin,
  Award,
  ShieldCheck,
  Share2,
  Mail,
  MessagesSquare,
  LayoutGrid,
  Info,
  Loader2,
  X,
  Wrench,
} from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { StarRating } from '../components/product/StarRating.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  useProvider,
  useProviderFollow,
  useProviderServices,
} from '../hooks/services/useServices.ts';
import { formatTimeRange } from '../lib/formatTimeRange.ts';
import { ProviderReviewsTab } from '../components/provider/ProviderReviewsTab.tsx';
import { ProductShareSheet } from '../components/product/ProductShareSheet.tsx';
import { SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';
import { useStartChat } from '../hooks/chat/useStartChat.ts';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { isNotFoundError } from '../utils/errors.ts';

export default function ProviderPage() {
  const { id: slug } = useParams();
  const { user } = useAuth();
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('services');
  const [sort, setSort] = useState<'latest' | 'most_requested' | 'price_asc' | 'price_desc'>(
    'latest',
  );
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { data: provider, isLoading, isPending, isError, error } = useProvider(slug);
  const providerUnavailable = isNotFoundError(error);
  const { data: servicesData, isLoading: servicesLoading } = useProviderServices(slug, { sort }, {
    enabled: Boolean(provider) && !providerUnavailable,
  });
  const { followMutation, unfollowMutation } = useProviderFollow(slug);
  const { startProviderChat, isStarting: isStartingChat } = useStartChat();
  const services = servicesData?.items ?? [];

  const joinedYear = provider?.joined_at
    ? new Date(provider.joined_at).getFullYear().toString()
    : '—';

  const isOwnProvider = Boolean(provider?.is_own_provider);

  const handleFollow = async () => {
    if (!user) {
      toast.error(t('serviceMarketplace.providerPage.followLoginRequired'));
      return;
    }
    if (!provider) return;

    try {
      if (provider.follow.is_following) {
        await unfollowMutation.mutateAsync();
        toast.success(t('serviceMarketplace.providerPage.unfollowed'));
      } else {
        await followMutation.mutateAsync();
        toast.success(t('serviceMarketplace.providerPage.followed'));
      }
    } catch {
      toast.error(t('store.followError'));
    }
  };

  const handleContactProvider = async () => {
    if (!user) {
      toast.error(t('serviceMarketplace.providerPage.followLoginRequired'));
      return;
    }

    if (!provider || isOwnProvider) {
      toast.warning(t('chat.selfChatNotAllowed'));
      return;
    }

    await startProviderChat(provider.id, {
      subject: provider.display_name,
      returnPath: `/provider/${provider.slug}`,
    });
  };

  const unavailableState = (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <EmptyState
        icon={<Wrench size={32} strokeWidth={1.5} />}
        title={t('serviceMarketplace.providerPage.unavailableTitle')}
        description={t('serviceMarketplace.providerPage.unavailableDescription')}
      />
    </div>
  );

  if (providerUnavailable) {
    return unavailableState;
  }

  if (isPending && !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
      </div>
    );
  }

  if (isError || !provider) {
    if (isNotFoundError(error)) {
      return unavailableState;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <EmptyState
          icon={<Wrench size={32} strokeWidth={1.5} />}
          title={t('serviceMarketplace.providerPage.loadError')}
          description={t('serviceMarketplace.providerPage.unavailableDescription')}
        />
      </div>
    );
  }

  const policyItems = provider.work_policy_summary ?? [];
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/provider/${provider.slug}` : '';

  return (
    <div className="bg-gray-50 min-h-screen pb-16" dir={dir}>
      <div
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => setIsGalleryOpen(true)}
      >
        <img
          src={provider.cover_url || SERVICE_IMAGE_FALLBACK}
          alt={provider.display_name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 inset-s-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
            aria-label={t('serviceMarketplace.providerPage.shareTitle')}
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl md:rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-16 md:-mt-20">
              <img
                src={provider.avatar_url || SERVICE_IMAGE_FALLBACK}
                alt={provider.display_name}
                className="w-full h-full object-cover bg-white"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200';
                }}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark">
                  {provider.display_name}
                </h1>
                {provider.verified && (
                  <ShieldCheck className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
                )}
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                {provider.bio}
              </p>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <StarRating value={provider.rating_average} readOnly size={14} />
                  <span className="font-bold text-diyar-dark tabular-nums">
                    {provider.rating_average}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t('serviceMarketplace.providerPage.reviewsCount', {
                      count: provider.reviews_count,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-4 h-4 text-diyar-brown" />
                  <span>{provider.location}</span>
                </div>
              </div>
            </div>

            {!isOwnProvider && (
              <div className="flex gap-3 md:w-auto w-full">
                <button
                  type="button"
                  onClick={() => void handleFollow()}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className="flex-1 md:flex-none bg-diyar-dark text-white font-bold py-2.5 px-8 rounded-xl hover:bg-black transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {provider.follow.is_following
                    ? t('serviceMarketplace.providerPage.unfollow')
                    : t('serviceMarketplace.providerPage.follow')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleContactProvider()}
                  disabled={isStartingChat}
                  className="flex-1 md:flex-none bg-white text-diyar-dark font-bold py-2.5 px-6 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isStartingChat ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessagesSquare size={18} />
                  )}
                  {t('serviceMarketplace.providerPage.contact')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">
                {t('serviceMarketplace.providerPage.statsTitle')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.providerPage.completedProjects')}
                  </span>
                  <span className="font-bold text-diyar-dark tabular-nums">
                    {provider.completed_projects_count}+
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.providerPage.servicesCount')}
                  </span>
                  <span className="font-bold text-diyar-dark">
                    {t('serviceMarketplace.providerPage.servicesUnit', {
                      count: provider.active_services_count ?? 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.providerPage.followers')}
                  </span>
                  <span className="font-bold text-diyar-dark tabular-nums">
                    {t('serviceMarketplace.providerPage.followersCount', {
                      count: provider.follow.followers_count ?? 0,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.providerPage.joinedAt')}
                  </span>
                  <span className="font-bold text-diyar-dark">{joinedYear}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">
                {t('serviceMarketplace.providerPage.badgesTitle')}
              </h3>
              <div className="space-y-3">
                {(provider.badges.length > 0
                  ? provider.badges
                  : [t('serviceMarketplace.providerPage.verifiedBadge')]
                ).map((badge) => (
                  <div key={badge} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-gray-700 font-medium">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex border-b border-gray-200 mb-6 font-medium text-sm md:text-base">
              {(
                [
                  {
                    id: 'services',
                    icon: LayoutGrid,
                    label: t('serviceMarketplace.providerPage.tabs.services'),
                  },
                  {
                    id: 'about',
                    icon: Info,
                    label: t('serviceMarketplace.providerPage.tabs.about'),
                  },
                  {
                    id: 'reviews',
                    icon: Award,
                    label: t('serviceMarketplace.providerPage.tabs.reviews'),
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-6 shrink-0 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon size={18} />
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

            {activeTab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-diyar-dark">
                    {t('serviceMarketplace.providerPage.allServices')}
                  </h2>
                  <select
                    value={sort}
                    onChange={(e) =>
                      setSort(
                        e.target.value as 'latest' | 'most_requested' | 'price_asc' | 'price_desc',
                      )
                    }
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-4 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown cursor-pointer"
                  >
                    <option value="latest">
                      {t('serviceMarketplace.providerPage.sortLatest')}
                    </option>
                    <option value="most_requested">
                      {t('serviceMarketplace.providerPage.sortMostRequested')}
                    </option>
                    <option value="price_asc">
                      {t('serviceMarketplace.providerPage.sortPriceAsc')}
                    </option>
                    <option value="price_desc">
                      {t('serviceMarketplace.providerPage.sortPriceDesc')}
                    </option>
                  </select>
                </div>

                {servicesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    {services.map((srv) => (
                      <ServiceCard key={srv.id} service={srv} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-600 mb-2">
                      {t('serviceMarketplace.providerPage.emptyServicesTitle')}
                    </h3>
                    <p className="text-gray-400">
                      {t('serviceMarketplace.providerPage.emptyServicesDescription')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-diyar-dark mb-4">
                  {t('serviceMarketplace.providerPage.aboutTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">{provider.bio}</p>

                {(provider.working_hours?.length ?? 0) > 0 && (
                  <>
                    <h3 className="font-bold text-lg text-diyar-dark mb-4">
                      {t('serviceMarketplace.providerPage.workingHours')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
                      {provider.working_hours.map((hour) => (
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
                            {hour.label ?? t(`vendor.settings.weekdays.${hour.day}`)}
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

                <h3 className="font-bold text-lg text-diyar-dark mb-4">
                  {t('serviceMarketplace.providerPage.policyTitle')}
                </h3>
                {policyItems.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {policyItems.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {t('serviceMarketplace.providerPage.policyEmpty')}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ProviderReviewsTab
                slug={provider.slug}
                providerName={provider.display_name}
                providerAvatarUrl={provider.avatar_url}
              />
            )}
          </div>
        </div>
      </div>

      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-200 flex flex-col justify-center animate-in fade-in duration-300 p-4">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-6 inset-e-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full cursor-pointer"
          >
            <X size={24} />
          </button>

          <div className="relative w-full max-w-5xl mx-auto">
            <div className="aspect-4/3 md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
              <img
                src={provider.cover_url || SERVICE_IMAGE_FALLBACK}
                alt={provider.display_name}
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&q=80&w=800';
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ProductShareSheet
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
        title={provider.display_name}
        context="provider"
      />
    </div>
  );
}
