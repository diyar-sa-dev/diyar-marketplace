import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Share2,
  Mail,
  Info,
  Clock,
  CheckCircle,
  Smartphone,
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
} from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { RequestServiceModal } from '../components/modals/RequestServiceModal.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { useRelatedServices, useService } from '../hooks/services/useServices.ts';
import { SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';

export default function ServicePage() {
  const { id } = useParams();
  const { t } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: service, isLoading, isError } = useService(id);
  const { data: relatedServices = [] } = useRelatedServices(id);

  const provider = service?.provider;
  const providerSlug = provider?.slug ?? '';
  const galleryImages = useMemo(() => {
    const portfolio = service?.portfolio?.map((item) => item.media_url).filter(Boolean) as string[];
    if (portfolio && portfolio.length > 0) {
      return portfolio;
    }
    return service?.image_url ? [service.image_url] : [];
  }, [service]);

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
        <p className="text-gray-600 font-medium">تعذر تحميل تفاصيل الخدمة.</p>
      </div>
    );
  }

  const coverImage = provider?.cover_url || service.image_url || SERVICE_IMAGE_FALLBACK;
  const features = service.features ?? [];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
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
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition cursor-pointer"
          >
            <Share2 size={20} />
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
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark leading-snug">
                  {service.title}
                </h1>
                {provider && (
                  <Link
                    to={`/provider/${providerSlug}`}
                    className="inline-flex items-center gap-1.5 mt-2.5 w-fit text-sm text-gray-400 hover:text-diyar-brown transition-colors group"
                  >
                    <User size={15} className="text-diyar-brown" /> مقدم الخدمة:
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
                  <span className="text-amber-700/60">({service.reviews_count} تقييم)</span>
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

            <div className="flex gap-3 md:w-auto w-full">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error('يرجى تسجيل الدخول لتقديم طلب.');
                    return;
                  }
                  setIsRequestOpen(true);
                }}
                className="flex-1 md:flex-none font-bold py-3 px-8 rounded-xl transition shadow-md w-full md:w-48 text-center text-lg bg-diyar-dark text-white hover:bg-black cursor-pointer"
              >
                طلب تنفيذ
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-diyar-dark mb-4">تفاصيل الخدمة</h3>
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
                <h3 className="text-xl font-bold text-diyar-dark mb-4">نماذج من أعمالنا</h3>
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
                التقييمات والآراء
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
                    بناءً على {service.reviews_count} تقييم
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-100">
                ستظهر تقييمات العملاء هنا بعد إتمام الحجوزات وترك المراجعات.
              </p>
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">تواصل مع المزود</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  disabled
                  className="w-full bg-green-50 text-green-400 border border-green-100 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Smartphone size={18} /> محادثة عبر الواتساب
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full bg-gray-50 text-gray-400 border border-gray-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Mail size={18} /> إرسال رسالة
                </button>
              </div>
            </div>

            {provider && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-lg text-diyar-dark mb-4">معلومات مزود الخدمة</h3>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                  <span className="text-gray-500 text-sm">المشاريع المنجزة</span>
                  <span className="font-bold text-diyar-dark">
                    {provider.completed_projects_count}+
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                  <span className="text-gray-500 text-sm">تقييم المزود</span>
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
                    زيارة صفحة المزود
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
            <h2 className="text-xl md:text-3xl font-bold text-diyar-dark">خدمات ذات صلة</h2>
            <Link
              to="/services"
              className="text-diyar-brown font-bold text-sm hover:underline flex items-center gap-1 shrink-0"
            >
              عرض الكل <ChevronLeft size={16} />
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
                    onClick={() =>
                      setGalleryIndex((prev) => (prev + 1) % galleryImages.length)
                    }
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
    </div>
  );
}
