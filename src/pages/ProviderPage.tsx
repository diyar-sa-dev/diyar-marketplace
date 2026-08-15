import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Award, ShieldCheck, Share2, Mail, LayoutGrid, Info, Clock, CheckCircle } from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';

export default function ProviderPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('services');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const PROVIDER_INFO = {
    id: id || '1',
    name: 'إيوان للتصميم',
    logo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
    cover: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&q=80&w=1200',
    description: 'نقدم خدمات التصميم الداخلي الشاملة للقصور والفلل والشقق السكنية. نصمم مساحات تعكس هويتك وتلبي احتياجاتك بدقة واحترافية عالية.',
    rating: 4.9,
    reviews: 84,
    completedProjects: 120,
    servicesCount: 12,
    joinedDate: '2020',
    location: 'الرياض، ونقدم استشارات عن بعد',
    badges: ['مزود موثق', 'تقييم عالي', 'مشاريع مكتملة بنجاح']
  };

  const SERVICES = [
    { id: 101, name: 'تصميم داخلي متكامل للشقق', img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400", vendor: PROVIDER_INFO.name, price: 'يبدأ من 50', rating: 4.8, type: "استشارة ومخطط" },
    { id: 102, name: 'تصميم 3D للمكاتب وإخراج الصور', img: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=400", vendor: PROVIDER_INFO.name, price: '1500', rating: 4.9, type: "سعر ثابت" },
    { id: 103, name: 'توزيع وتصميم الإضاءة المعمارية', img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400", vendor: PROVIDER_INFO.name, price: '600', rating: 4.7, type: "مخططات فنية" },
    { id: 104, name: 'جلسة استشارة تصميم أونلاين', img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400", vendor: PROVIDER_INFO.name, price: '300', rating: 5.0, type: "بالساعة" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Image */}
      <div 
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => setIsGalleryOpen(true)}
      >
        <img 
          src={PROVIDER_INFO.cover} 
          alt={PROVIDER_INFO.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                src={PROVIDER_INFO.logo} 
                alt={PROVIDER_INFO.name} 
                className="w-full h-full object-cover bg-white"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark">{PROVIDER_INFO.name}</h1>
                <ShieldCheck className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                {PROVIDER_INFO.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-diyar-dark">{PROVIDER_INFO.rating}</span>
                  <span className="text-xs text-gray-400">({PROVIDER_INFO.reviews} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-4 h-4 text-diyar-brown" />
                  <span>{PROVIDER_INFO.location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 md:w-auto w-full">
              <button className="flex-1 md:flex-none bg-diyar-dark text-white font-bold py-2.5 px-8 rounded-xl hover:bg-black transition shadow-md">
                متابعة المزود
              </button>
              <button className="flex-1 md:flex-none bg-gray-100 text-diyar-dark font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-2">
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
                  <span className="font-bold text-diyar-dark">{PROVIDER_INFO.completedProjects}+</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">عدد الخدمات</span>
                  <span className="font-bold text-diyar-dark">{PROVIDER_INFO.servicesCount} خدمات</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">تاريخ الانضمام</span>
                  <span className="font-bold text-diyar-dark">{PROVIDER_INFO.joinedDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">مميزات المزود</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-gray-700 font-medium">مزود موثوق ومعتمد من ديار</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-gray-700 font-medium">تسليم المشاريع في الوقت المحدد</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-gray-700 font-medium">رضا عملاء مرتفع 4.9/5</span>
                </div>
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
                  <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-4 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown">
                    <option>الأحدث</option>
                    <option>الأكثر طلباً</option>
                    <option>السعر: من الأقل للأعلى</option>
                    <option>السعر: من الأعلى للأقل</option>
                  </select>
                </div>
                
                {SERVICES.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    {SERVICES.map((srv) => (
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
                <p className="text-gray-600 leading-relaxed mb-8">
                  تأسس مكتب "إيوان للتصميم" كفريق من المصممين المعماريين والداخليين الشغوفين بابتكار مساحات معيشية وعملية تعكس هوية ساكنيها. ندمج بين الفن والعلم لنحول الخيالات إلى واقع يتخطى توقعات العملاء.
                </p>

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
              <div className="space-y-6">
                {/* Rating Overview */}
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="text-center md:border-l md:border-gray-150 py-2">
                      <p className="text-5xl font-extrabold text-diyar-dark mb-2">{PROVIDER_INFO.rating}</p>
                      <div className="flex justify-center gap-1 text-amber-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-gray-500 text-xs">تقييم عام بناءً على {PROVIDER_INFO.reviews} رأي</p>
                    </div>
                    
                    <div className="col-span-2 space-y-2">
                      {[
                        { stars: 5, pct: 90, count: 76 },
                        { stars: 4, pct: 8, count: 6 },
                        { stars: 3, pct: 2, count: 2 },
                        { stars: 2, pct: 0, count: 0 },
                        { stars: 1, pct: 0, count: 0 }
                      ].map((item) => (
                        <div key={item.stars} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-bold shrink-0 w-3">{item.stars}</span>
                          <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-450 shrink-0 w-10 text-left">{item.pct}%</span>
                          <span className="text-xs text-gray-400 shrink-0 w-12 hidden sm:inline">({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {[
                    { id: 1, name: "عبدالرحمن الحربي", rating: 5, date: "منذ ٣ أيام", text: "تعاملت مع مكتب إيوان لتصميم شقتي السكنية والنتيجة كانت مبهرة جداً. استغلال رائع للمساحات وخبرة هندسية واضحة في توزيع الإضاءة ومخططات السباكة والكهرباء." },
                    { id: 2, name: "منى الدوسري", rating: 5, date: "منذ أسبوعين", text: "مهندسين محترفين جداً ومستمعين جيدين لكل متطلبات العميل. التصميم ثلاثي الأبعاد كان مطابقاً تماماً لما تمنيته وسرعة في إنجاز المخططات الأساسية." },
                    { id: 3, name: "خالد السديري", rating: 4, date: "منذ شهر", text: "الخدمة ممتازة والتصاميم مبتكرة جداً ومناسبة للميزانية المحددة. تم طلب تعديل بسيط على إحدى الغرف وتجاوبوا بسرعة." }
                  ].map((rev) => (
                    <div key={rev.id} className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold text-sm shrink-0 border border-diyar-brown/20 select-none">
                        {rev.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-diyar-dark text-sm sm:text-base">{rev.name}</h4>
                            <div className="flex gap-0.5 text-amber-400 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={11} fill={i < rev.rating ? "currentColor" : "none"} strokeWidth={i < rev.rating ? 0 : 2} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{rev.date}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{rev.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col justify-center animate-in fade-in duration-300 p-4">
           <button 
             onClick={() => setIsGalleryOpen(false)}
             className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full"
           >
             <X size={24} />
           </button>
           
           <div className="relative w-full max-w-5xl mx-auto">
              <div className="aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
                 <img 
                   src={PROVIDER_INFO.cover} 
                   alt="Provider Cover" 
                   className="max-w-full max-h-full object-contain"
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&q=80&w=800";
                   }}
                 />
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// Reuse icon
import { X as XIcon } from 'lucide-react';
const X = XIcon;
