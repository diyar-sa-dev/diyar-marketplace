import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin,
  Star,
  Award,
  ShieldCheck,
  Share2,
  Mail,
  LayoutGrid,
  Info,
  Clock,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useProvider, useProviderFollow, useProviderServices } from '../hooks/services/useServices.ts';
import { SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';

export default function ProviderPage() {
  const { id: slug } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [sort, setSort] = useState<'latest' | 'most_requested' | 'price_asc' | 'price_desc'>(
    'latest',
  );
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const { data: provider, isLoading, isError } = useProvider(slug);
  const { data: servicesData, isLoading: servicesLoading } = useProviderServices(slug, { sort });
  const { followMutation, unfollowMutation } = useProviderFollow(slug);
  const services = servicesData?.items ?? [];

  const joinedYear = provider?.joined_at
    ? new Date(provider.joined_at).getFullYear().toString()
    : '—';

  const handleFollow = () => {
    if (!user || !provider) return;
    if (provider.follow.is_following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 font-medium">تعذر تحميل ملف المزود.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Image */}
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
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Provider Profile Header */}
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            {/* Logo */}
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

            {/* Info */}
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
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-diyar-dark">{provider.rating_average}</span>
                  <span className="text-xs text-gray-400">({provider.reviews_count} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-4 h-4 text-diyar-brown" />
                  <span>{provider.location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 md:w-auto w-full">
              <button
                type="button"
                onClick={handleFollow}
                disabled={!user || followMutation.isPending || unfollowMutation.isPending}
                className="flex-1 md:flex-none bg-diyar-dark text-white font-bold py-2.5 px-8 rounded-xl hover:bg-black transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {provider.follow.is_following ? 'إلغاء المتابعة' : 'متابعة المزود'}
              </button>
              <button
                type="button"
                disabled
                className="flex-1 md:flex-none bg-gray-100 text-gray-400 font-bold py-2.5 px-6 rounded-xl border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Mail size={18} />
                تواصل
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">إحصائيات المزود</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">مشاريع منجزة</span>
                  <span className="font-bold text-diyar-dark">
                    {provider.completed_projects_count}+
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">عدد الخدمات</span>
                  <span className="font-bold text-diyar-dark">
                    {provider.active_services_count ?? 0} خدمات
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">تاريخ الانضمام</span>
                  <span className="font-bold text-diyar-dark">{joinedYear}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">مميزات المزود</h3>
              <div className="space-y-3">
                {(provider.badges.length > 0 ? provider.badges : ['مزود خدمات معتمد']).map(
                  (badge) => (
                    <div key={badge} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-gray-700 font-medium">{badge}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 font-medium text-sm md:text-base">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-3 px-6 shrink-0 transition-colors ${activeTab === 'services' ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid size={18} />
                  الخدمات
                </div>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-3 px-6 shrink-0 transition-colors ${activeTab === 'about' ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
              >
                <div className="flex items-center gap-2">
                  <Info size={18} />
                  عن المزود
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-6 shrink-0 transition-colors ${activeTab === 'reviews' ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
              >
                <div className="flex items-center gap-2">
                  <Star size={18} />
                  التقييمات
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-diyar-dark">جميع الخدمات والمعروضات</h2>
                  <select
                    value={sort}
                    onChange={(e) =>
                      setSort(
                        e.target.value as
                          | 'latest'
                          | 'most_requested'
                          | 'price_asc'
                          | 'price_desc',
                      )
                    }
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-4 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown cursor-pointer"
                  >
                    <option value="latest">الأحدث</option>
                    <option value="most_requested">الأكثر طلباً</option>
                    <option value="price_asc">السعر: من الأقل للأعلى</option>
                    <option value="price_desc">السعر: من الأعلى للأقل</option>
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
                    <h3 className="text-lg font-bold text-gray-600 mb-2">لا توجد خدمات</h3>
                    <p className="text-gray-400">هذا المزود لم يقم بإضافة أي خدمات بعد.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-diyar-dark mb-4">نبذة عن المزود</h2>
                <p className="text-gray-600 leading-relaxed mb-8">{provider.bio}</p>

                <h3 className="font-bold text-lg text-diyar-dark mb-4">أوقات العمل</h3>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 w-fit">
                  <Clock className="text-diyar-brown shrink-0" />
                  <div>
                    <p className="font-medium">الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً</p>
                    <p className="text-sm mt-1">الجمعة والسبت: مغلق</p>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-diyar-dark mb-4">سياسة العمل</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>يتم تسليم المخططات الأولية خلال 7 أيام عمل من الاستشارة.</li>
                  <li>يشمل السعر تعديلين مجانيين على التصاميم ثلاثية الأبعاد.</li>
                  <li>يتم الاتفاق على المدى الزمني للتنفيذ بناءً على حجم المشروع وتعقيده.</li>
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <div className="text-center py-8">
                  <p className="text-5xl font-extrabold text-diyar-dark mb-2">
                    {provider.rating_average}
                  </p>
                  <p className="text-gray-500 text-sm">
                    بناءً على {provider.reviews_count} تقييم — ستظهر المراجعات التفصيلية بعد إطلاق
                    تقييمات الخدمات.
                  </p>
                </div>
              </div>
            )}
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
                src={provider.cover_url || SERVICE_IMAGE_FALLBACK}
                alt="Provider Cover"
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
    </div>
  );
}

