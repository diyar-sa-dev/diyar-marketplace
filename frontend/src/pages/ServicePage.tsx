import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Star,
  Share2,
  Mail,
  MessagesSquare,
  Info,
  Clock,
  CheckCircle,
  Smartphone,
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Bookmark,
  CalendarCheck,
} from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { RequestServiceModal } from '../components/modals/RequestServiceModal.tsx';
import { DirectBookingModal } from '../components/modals/DirectBookingModal.tsx';
import { ProductShareSheet } from '../components/product/ProductShareSheet.tsx';
import { ServiceTypeBadge } from '../components/services/ServiceTypeBadge.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { useRelatedServices, useService } from '../hooks/services/useServices.ts';
import { SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';
import {
  resolveServiceTypeLabel,
  bookingStatusBadgeClass,
  formatBookingTime,
} from '../lib/serviceBookingDisplay.ts';
import type { ServiceBookingStatus } from '../types/serviceRequests.ts';
import type { ServiceUserActiveBooking } from '../types/services.ts';
import { useServiceWishlistMutation } from '../hooks/services/useServiceEngagement.ts';
import { useStartChat } from '../hooks/chat/useStartChat.ts';
import { shouldHideMarketplaceCommerce } from '../lib/marketplaceCommerce.ts';
import { buildWhatsAppUrl } from '../lib/whatsapp.ts';

function resolveActiveBookingHint(
  booking: ServiceUserActiveBooking,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const date = booking.scheduled_date ?? '';
  const time = formatBookingTime(booking.scheduled_time);

  switch (booking.status) {
    case 'pending_provider_confirmation':
      return t('serviceMarketplace.detail.alreadyReservedPendingProvider');
    case 'pending_customer_acceptance':
      return t('serviceMarketplace.detail.alreadyReservedPendingAcceptance');
    case 'pending_payment':
      return t('serviceMarketplace.detail.alreadyReservedPendingPayment');
    case 'confirmed':
      return t('serviceMarketplace.detail.alreadyReservedConfirmed', { date, time });
    case 'in_progress':
      return t('serviceMarketplace.detail.alreadyReservedInProgress');
    default:
      return t('serviceMarketplace.detail.alreadyReserved');
  }
}

function bookingStatusLabel(status: ServiceBookingStatus, t: (key: string) => string): string {
  return t(`serviceBookings.status.${status}`);
}

export default function ServicePage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: service, isLoading, isError } = useService(id);
  const { data: relatedServices = [] } = useRelatedServices(id);
  const wishlist = useServiceWishlistMutation(id);
  const { startProviderChat, isStarting: isStartingChat } = useStartChat();

  const provider = service?.provider;
  const providerSlug = provider?.slug ?? '';
  const whatsappUrl = useMemo(() => {
    if (!provider?.contact_phone || !service) {
      return null;
    }

    return buildWhatsAppUrl(
      provider.contact_phone,
      t('serviceMarketplace.detail.whatsappPrefill', {
        provider: provider.display_name,
        service: service.title,
      }),
    );
  }, [provider, service, t]);
  const galleryImages = useMemo(() => {
    const portfolio = service?.portfolio?.map((item) => item.media_url).filter(Boolean) as string[];
    if (portfolio && portfolio.length > 0) {
      return portfolio;
    }
    return service?.image_url ? [service.image_url] : [];
  }, [service]);

  useEffect(() => {
    if (!service) {
      return;
    }

    if (searchParams.get('request') === '1') {
      if (!user) {
        toast.error(t('serviceMarketplace.detail.loginRequired'));
        searchParams.delete('request');
        setSearchParams(searchParams, { replace: true });
        return;
      }
      setIsRequestOpen(true);
      searchParams.delete('request');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (searchParams.get('book') === '1') {
      if (!user) {
        toast.error(t('serviceMarketplace.detail.loginRequired'));
        searchParams.delete('book');
        setSearchParams(searchParams, { replace: true });
        return;
      }
      if (service.booking_mode === 'direct') {
        if (service.user_active_booking) {
          toast.info(t('serviceMarketplace.detail.alreadyBookedToast'));
        } else {
          setIsBookingOpen(true);
        }
      } else {
        toast.error(t('directBooking.notAvailable'));
      }
      searchParams.delete('book');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, service, setSearchParams, t, toast, user]);

  useEffect(() => {
    if (service) {
      setIsSaved(Boolean(service.user_saved));
    }
  }, [service?.id, service?.user_saved]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 font-medium">{t('serviceMarketplace.detail.loadError')}</p>
      </div>
    );
  }

  const coverImage = provider?.cover_url || service.image_url || SERVICE_IMAGE_FALLBACK;
  const features = service.features ?? [];
  const isDirectBooking = service.booking_mode === 'direct';
  const isOwnProvider = Boolean(service.provider?.is_own_provider);
  const isCommerceBlocked = isOwnProvider || shouldHideMarketplaceCommerce(user?.roles);
  const activeBooking = service.user_active_booking ?? null;

  const handleSendMessage = async () => {
    if (!user) {
      toast.error(t('serviceMarketplace.detail.loginRequired'));
      return;
    }

    if (!provider || isCommerceBlocked) {
      toast.warning(t('chat.selfChatNotAllowed'));
      return;
    }

    await startProviderChat(provider.id, {
      subject: service.title,
      context_type: 'service',
      context_id: service.id,
      returnPath: `/service/${service.slug ?? service.id}`,
    });
  };

  const typeLabel = resolveServiceTypeLabel(service);
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/service/${service.slug}` : '';
  const primaryActionLabel = isDirectBooking
    ? t('serviceMarketplace.detail.bookNow')
    : t('serviceMarketplace.detail.requestService');

  return (
    <div className="bg-gray-50 min-h-screen pb-16" dir={dir}>
      <div
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => {
          if (galleryImages.length > 0) {
            setGalleryIndex(0);
            setIsGalleryOpen(true);
          }
        }}
      >
        <img
          src={coverImage}
          alt={service.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
        <div
          className="absolute top-4 right-4 flex gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to="/services"
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition"
          >
            <ChevronRight size={20} />
          </Link>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
          >
            <Share2 size={20} />
          </button>
          <button
            type="button"
            disabled={wishlist.isPending}
            onClick={() => {
              if (!user) {
                toast.error(t('serviceMarketplace.detail.loginRequired'));
                return;
              }
              void wishlist
                .mutateAsync()
                .then((result) => {
                  setIsSaved(result.saved);
                  toast.success(
                    result.saved
                      ? t('serviceMarketplace.detail.saved')
                      : t('serviceMarketplace.detail.unsaved'),
                  );
                })
                .catch(() => {
                  toast.error(t('serviceMarketplace.detail.loadError'));
                });
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer disabled:opacity-60"
          >
            <Bookmark size={20} className={isSaved ? 'fill-white' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            <Link
              to={`/provider/${providerSlug}`}
              className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-12 md:-mt-16 block hover:opacity-90 transition"
            >
              <img
                src={provider?.avatar_url || SERVICE_IMAGE_FALLBACK}
                alt={provider?.display_name || ''}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                }}
              />
            </Link>

            <div className="flex-1">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {typeLabel && <ServiceTypeBadge label={typeLabel} />}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark leading-snug">
                  {service.title}
                </h1>
                {provider && (
                  <Link
                    to={`/provider/${providerSlug}`}
                    className="inline-flex items-center gap-1.5 mt-2.5 w-fit text-sm text-gray-400 hover:text-diyar-brown transition-colors group"
                  >
                    <User size={15} className="text-diyar-brown" />{' '}
                    {t('serviceMarketplace.detail.provider')}
                    <span className="font-bold text-diyar-dark group-hover:text-diyar-brown transition-colors">
                      {provider.display_name}
                    </span>
                  </Link>
                )}
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">
                {service.description}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 md:gap-3 text-sm">
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-amber-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{service.rating_average}</span>
                  <span className="text-amber-700/60">
                    {t('serviceMarketplace.detail.reviews', { count: service.reviews_count })}
                  </span>
                </div>
                {service.location && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500">
                    <MapPin className="w-4 h-4 text-diyar-brown" />
                    <span>{service.location}</span>
                  </div>
                )}
                {service.pricing_label && (
                  <div className="flex items-center gap-1.5 bg-diyar-brown/10 px-3 py-1.5 rounded-lg border border-diyar-brown/20 text-diyar-brown font-bold">
                    <span>{service.pricing_label}</span>
                  </div>
                )}
              </div>
            </div>

            {!isCommerceBlocked && (
              <div className="flex flex-col gap-3 md:w-auto w-full md:min-w-52">
                {activeBooking && (
                  <div className="rounded-xl border border-diyar-brown/20 bg-diyar-brown/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CalendarCheck className="w-5 h-5 text-diyar-brown shrink-0 mt-0.5" />
                      <div className="min-w-0 space-y-1.5">
                        <p className="font-bold text-diyar-dark text-sm">
                          {t('serviceMarketplace.detail.alreadyReserved')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('serviceMarketplace.detail.alreadyReservedReference', {
                            reference: activeBooking.reference,
                          })}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {resolveActiveBookingHint(activeBooking, t)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${bookingStatusBadgeClass(activeBooking.status)}`}
                        >
                          {bookingStatusLabel(activeBooking.status, t)}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/orders?tab=bookings"
                      className="block w-full text-center font-bold py-2.5 px-4 rounded-xl transition shadow-sm bg-diyar-dark text-white hover:bg-black"
                    >
                      {t('serviceMarketplace.detail.viewMyBooking')}
                    </Link>
                  </div>
                )}

                {!activeBooking && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        toast.error(t('serviceMarketplace.detail.loginRequired'));
                        return;
                      }
                      if (isDirectBooking) {
                        setIsBookingOpen(true);
                      } else {
                        setIsRequestOpen(true);
                      }
                    }}
                    className="flex-1 md:flex-none font-bold py-3 px-8 rounded-xl transition shadow-md w-full md:w-48 text-center text-lg bg-diyar-dark text-white hover:bg-black cursor-pointer"
                  >
                    {primaryActionLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-diyar-dark mb-4">
                {t('serviceMarketplace.detail.details')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
              {features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 font-medium">
                      <CheckCircle className="text-green-500 w-5 h-5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {galleryImages.length > 0 && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-diyar-dark mb-4">
                  {t('serviceMarketplace.detail.portfolio')}
                </h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {galleryImages.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden h-32 md:h-48 group cursor-pointer relative"
                      onClick={() => {
                        setGalleryIndex(i);
                        setIsGalleryOpen(true);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400" size={24} />
                {t('serviceMarketplace.detail.reviewsTitle')}
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold text-diyar-dark">{service.rating_average}</div>
                <div className="flex flex-col">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${star <= Math.floor(service.rating_average) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 mt-1">
                    {t('serviceMarketplace.detail.reviewsBasedOn', {
                      count: service.reviews_count,
                    })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                {t('serviceMarketplace.detail.reviewsEmpty')}
              </p>
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            {!isCommerceBlocked ? (
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">
                {t('serviceMarketplace.detail.contactProvider')}
              </h3>
              <div className="space-y-3">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <Smartphone size={18} /> {t('serviceMarketplace.detail.whatsapp')}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-green-50 text-green-400 border border-green-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Smartphone size={18} /> {t('serviceMarketplace.detail.whatsapp')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={isStartingChat}
                  className="w-full bg-diyar-dark text-diyar-cream border border-diyar-dark font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-diyar-dark/90 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isStartingChat ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <MessagesSquare size={18} />
                  )}
                  {t('serviceMarketplace.detail.sendMessage')}
                </button>
              </div>
            </div>
            ) : null}

            {provider && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-lg text-diyar-dark mb-4">
                  {t('serviceMarketplace.detail.providerInfo')}
                </h3>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.detail.completedProjects')}
                  </span>
                  <span className="font-bold text-diyar-dark">
                    {provider.completed_projects_count}+
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                  <span className="text-gray-500 text-sm">
                    {t('serviceMarketplace.detail.providerRating')}
                  </span>
                  <span className="font-bold text-diyar-dark flex items-center gap-1">
                    {provider.rating_average}{' '}
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                  </span>
                </div>
                <div className="pt-3">
                  <Link
                    to={`/provider/${providerSlug}`}
                    className="block w-full text-center bg-gray-50 hover:bg-diyar-brown hover:text-white border border-gray-200 hover:border-diyar-brown text-diyar-dark font-bold py-2.5 rounded-xl text-xs transition-all"
                  >
                    {t('serviceMarketplace.detail.visitProvider')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {relatedServices.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12 pb-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-diyar-dark">
              {t('serviceMarketplace.detail.related')}
            </h2>
            <Link
              to="/services"
              className="text-diyar-brown font-bold text-sm hover:underline flex items-center gap-1 shrink-0"
            >
              {t('serviceMarketplace.catalog.viewAll')}{' '}
              {dir === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x pt-2 -mt-2 px-2 -mx-2 md:px-0 md:mx-0">
            {relatedServices.map((item) => (
              <div key={item.id} className="min-w-55 md:min-w-65 snap-start shrink-0">
                <ServiceCard service={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isGalleryOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-200 flex flex-col justify-center animate-in fade-in duration-300">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full cursor-pointer"
          >
            <X size={24} />
          </button>

          <div className="relative w-full max-w-5xl mx-auto p-4 md:p-12">
            <div className="aspect-4/3 md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
              <img
                src={galleryImages[galleryIndex % galleryImages.length] || coverImage}
                alt="Gallery"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                }}
              />
            </div>

            {galleryImages.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-4 md:left-8 flex items-center">
                  <button
                    type="button"
                    onClick={() => setGalleryIndex((prev) => (prev + 1) % galleryImages.length)}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition cursor-pointer"
                  >
                    <ChevronLeft size={24} />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryIndex(
                        (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
                      )
                    }
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition cursor-pointer"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-3 px-4 overflow-x-auto scrollbar-hide pb-4">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIndex(i)}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${galleryIndex === i ? 'border-diyar-brown scale-105 shadow-lg' : 'border-transparent opacity-50'}`}
              >
                <img
                  src={img}
                  className="w-full h-full object-cover"
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <RequestServiceModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        context={{
          serviceId: service.id,
          providerAccountId: service.provider?.id,
          defaultCategoryIds: service.category?.id ? [service.category.id] : undefined,
        }}
      />

      {isDirectBooking && (
        <DirectBookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          service={service}
        />
      )}

      <ProductShareSheet
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
        title={service.title}
        context="service"
      />
    </div>
  );
}
