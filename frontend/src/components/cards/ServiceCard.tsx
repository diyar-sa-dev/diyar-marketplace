import React, { useEffect, useState } from 'react';
import { Bookmark, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ServiceCard as ServiceCardType } from '../../types/services.ts';
import { SERVICE_IMAGE_FALLBACK } from '../../lib/services/serviceUi.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { ServiceTypeBadge } from '../services/ServiceTypeBadge.tsx';
import { resolveServiceTypeLabel } from '../../lib/serviceBookingDisplay.ts';
import { useServiceWishlistMutation } from '../../hooks/services/useServiceEngagement.ts';
import { StarRating } from '../product/StarRating.tsx';

type LegacyServiceShape = {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  img?: string;
  image_url?: string | null;
  vendor?: string;
  provider?: { display_name?: string };
  price?: string | number;
  pricing_label?: string | null;
  starting_price?: number | null;
  currency?: string;
  rating?: number;
  rating_average?: number;
  reviews_count?: number;
  type?: string;
  service_type_label?: string | null;
  delivery_type_label?: string | null;
  booking_mode?: 'request' | 'direct';
  user_saved?: boolean;
};

function normalizeServiceCard(
  service: ServiceCardType | LegacyServiceShape,
  scheduleFallback: string,
  currencyLabel: string,
) {
  const title = ('title' in service && service.title) || ('name' in service && service.name) || '';
  const slug = service.slug || String(('id' in service && service.id) ?? '');
  const imageUrl =
    resolveMediaUrl(
      ('image_url' in service && service.image_url) ||
        ('img' in service && service.img) ||
        null,
    ) ||
    ('img' in service && service.img) ||
    SERVICE_IMAGE_FALLBACK;
  const vendorName =
    ('provider' in service && service.provider?.display_name) ||
    ('vendor' in service && service.vendor) ||
    '';
  const rating =
    ('rating_average' in service && service.rating_average) ||
    ('rating' in service && service.rating) ||
    0;
  const reviewsCount =
    ('reviews_count' in service && service.reviews_count) ||
    ('reviews' in service && (service as { reviews?: number }).reviews) ||
    0;
  const typeLabel =
    resolveServiceTypeLabel(service as ServiceCardType) ||
    ('type' in service && service.type) ||
    scheduleFallback;
  const currency =
    ('currency' in service && service.currency) || currencyLabel;
  const startingPrice =
    'starting_price' in service && service.starting_price != null
      ? Number(service.starting_price)
      : null;
  const priceAmount =
    startingPrice != null
      ? `${startingPrice} ${currency}`
      : 'price' in service && service.price != null
        ? String(service.price)
        : null;
  const priceLabel =
    ('pricing_label' in service && service.pricing_label) || priceAmount || '—';

  return {
    title,
    slug,
    imageUrl,
    vendorName,
    rating,
    reviewsCount: Number(reviewsCount),
    typeLabel,
    priceLabel,
    priceAmount,
    startingPrice,
    bookingMode: (('booking_mode' in service && service.booking_mode) || 'request') as
      'request' | 'direct',
  };
}

const ServiceCard: React.FC<{
  service: ServiceCardType | LegacyServiceShape;
  layout?: 'grid' | 'list';
}> = ({ service, layout = 'grid' }) => {
  const { t } = useLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    title,
    slug,
    imageUrl,
    vendorName,
    rating,
    reviewsCount,
    typeLabel,
    priceLabel,
    priceAmount,
    startingPrice,
    bookingMode,
  } = normalizeServiceCard(
    service,
    t('serviceMarketplace.catalog.scheduleAppointment'),
    t('providerDashboard.common.currency'),
  );
  const wishlist = useServiceWishlistMutation(slug);
  const [isSaved, setIsSaved] = useState(
    () => ('user_saved' in service && service.user_saved) || false,
  );

  useEffect(() => {
    setIsSaved(('user_saved' in service && service.user_saved) || false);
  }, [service]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  const isDirectBooking = bookingMode === 'direct';
  const actionLabel = isDirectBooking
    ? t('serviceMarketplace.detail.bookNow')
    : t('serviceMarketplace.detail.requestService');
  const actionHint = isDirectBooking
    ? t('serviceMarketplace.detail.bookNowHint')
    : t('serviceMarketplace.detail.requestServiceHint');

  const handleServiceAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error(t('serviceMarketplace.detail.loginRequired'));
      return;
    }
    navigate(`/service/${slug}?${isDirectBooking ? 'book=1' : 'request=1'}`);
  };

  const priceDisplay = (
    <>
      <span className="text-[10px] sm:text-xs text-gray-400">
        {t('serviceMarketplace.catalog.startingPrice')}:
      </span>
      <div className="leading-tight">
        {startingPrice != null && priceAmount ? (
          <>
            <span className="text-xs sm:text-sm text-gray-600">
              {t('serviceMarketplace.catalog.startsFrom')}{' '}
            </span>
            <span className="font-bold text-sm sm:text-lg text-diyar-brown">{priceAmount}</span>
          </>
        ) : (
          <span className="font-bold text-sm sm:text-lg text-diyar-brown">{priceLabel}</span>
        )}
      </div>
    </>
  );

  if (layout === 'list') {
    return (
      <Link to={`/service/${slug}`} className="block w-full group">
        <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-md bg-white relative flex flex-row h-32 sm:h-36 md:h-40">
          <div className="relative w-1/3 min-w-27.5 sm:min-w-32.5 md:min-w-37.5 h-full overflow-hidden shrink-0">
            <img
              src={imageUrl}
              alt={title}
              width={400}
              height={300}
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
              }}
            />
            {typeLabel && typeLabel !== t('serviceMarketplace.catalog.scheduleAppointment') && (
              <ServiceTypeBadge label={typeLabel} overlay />
            )}
            <Bookmark
              className={`absolute top-2 inset-s-2 cursor-pointer bg-white/80 backdrop-blur-md p-1.5 rounded-full w-7 h-7 shadow-sm transition-all z-10 ${isSaved ? 'text-diyar-brown fill-diyar-brown' : 'text-gray-500 hover:text-diyar-brown hover:scale-110'}`}
              onClick={handleToggleSave}
            />
          </div>

          <div className="flex flex-col grow p-2.5 sm:p-4 justify-between h-full font-sans">
            <div>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-xs font-medium">
                  <Store size={11} className="text-diyar-brown" />
                  <span>{vendorName}</span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <StarRating value={rating} readOnly size={9} />
                  {reviewsCount > 0 ? (
                    <span className="text-[9px] text-gray-500 tabular-nums">({reviewsCount})</span>
                  ) : null}
                </div>
              </div>

              <h3 className="font-bold text-xs sm:text-base mb-1 line-clamp-1 sm:line-clamp-2 text-diyar-dark leading-snug">
                {title}
              </h3>

              <div className="flex items-center gap-2 mb-1 text-[9px] sm:text-xs text-gray-500">
                {typeLabel && <ServiceTypeBadge label={typeLabel} />}
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-2 mb-1">
              <div className="w-[70%] min-w-36 flex flex-col justify-center">{priceDisplay}</div>
              <div className="w-[30%] min-w-22 flex-1 flex">
                <button
                  className="w-full self-stretch bg-diyar-brown text-white rounded-lg py-1 px-2 sm:py-1.5 sm:px-3 font-bold text-[10px] sm:text-xs transition-all hover:bg-orange-700 flex items-center justify-center gap-1 z-10 relative cursor-pointer"
                  title={actionHint}
                  onClick={handleServiceAction}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/service/${slug}`} className="block h-full group">
      <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white relative flex flex-col h-full">
        <div className="relative mb-2 aspect-4/3 md:h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            width={400}
            height={300}
            decoding="async"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
            }}
          />
          {typeLabel && typeLabel !== t('serviceMarketplace.catalog.scheduleAppointment') && (
            <ServiceTypeBadge label={typeLabel} overlay />
          )}
          <Bookmark
            className={`absolute top-2 inset-s-2 cursor-pointer bg-white/80 backdrop-blur-md p-1.5 rounded-full w-7 h-7 shadow-sm transition-all z-10 ${isSaved ? 'text-diyar-brown fill-diyar-brown' : 'text-gray-500 hover:text-diyar-brown hover:scale-110'}`}
            onClick={handleToggleSave}
          />
        </div>

        <div className="flex flex-col grow px-3.5 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium min-w-0">
              <Store size={12} className="text-diyar-brown shrink-0" />
              <span className="truncate">{vendorName}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0 shrink-0">
              <StarRating value={rating} readOnly size={10} />
              {reviewsCount > 0 ? (
                <span className="text-[10px] text-gray-500 tabular-nums">({reviewsCount})</span>
              ) : null}
            </div>
          </div>

          <h3 className="font-bold text-sm md:text-base mb-1.5 line-clamp-2 text-diyar-dark leading-snug">
            {title}
          </h3>

          <div className="flex items-center gap-2 mb-2 mt-auto text-[10px] text-gray-500">
            {typeLabel && <ServiceTypeBadge label={typeLabel} />}
          </div>

          <div className="flex flex-wrap items-stretch gap-2 mt-1">
            <div className="w-[70%] min-w-36 flex flex-col justify-center">
              <span className="text-xs text-gray-500">
                {t('serviceMarketplace.catalog.startingPrice')}:
              </span>
              <div className="leading-tight">
                {startingPrice != null && priceAmount ? (
                  <>
                    <span className="text-xs text-gray-600">
                      {t('serviceMarketplace.catalog.startsFrom')}{' '}
                    </span>
                    <span className="font-bold text-base text-diyar-brown">{priceAmount}</span>
                  </>
                ) : (
                  <span className="font-bold text-base text-diyar-brown">{priceLabel}</span>
                )}
              </div>
            </div>
            <div className="w-[30%] min-w-22 flex-1 flex">
              <button
                className="w-full self-stretch bg-diyar-brown text-white rounded-lg py-1.5 px-2 font-bold text-xs transition-colors hover:bg-orange-700 flex items-center justify-center gap-1.5 z-10 relative cursor-pointer"
                title={actionHint}
                onClick={handleServiceAction}
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
