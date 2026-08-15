import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Share2, Mail, Info, Clock, CheckCircle, Smartphone, User, ChevronRight, ChevronLeft } from 'lucide-react';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { useCart } from '../context/CartContext.tsx';

export default function ServicePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('about');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const MOCK_REVIEWS = [
    { id: 1, name: 'أحمد محمد', rating: 5, date: 'قبل يومين', comment: 'خدمة ممتازة وتصميم رائع، التزموا بالمواعيد وبكل التفاصيل. أنصح بالتعامل معهم بشدة.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
    { id: 2, name: 'سارة خالد', rating: 4, date: 'قبل أسبوع', comment: 'العمل معهم كان مريحاً جداً، أفكارهم عصرية وحلولهم عملية. شكرا إيوان.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
    { id: 3, name: 'فهد العبدالله', rating: 5, date: 'قبل شهر', comment: 'افضل مصممين تعاملت معهم، حولوا مساحتي لمكان خيالي.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
  ];

  const SERVICE_INFO = {
    id: id || '1',
    name: 'تصميم داخلي متكامل',
    provider: 'إيوان للتصميم',
    logo: 'https://images.unsplash.com/photo-1600121848594-d8641e576d13?auto=format&fit=crop&q=80&w=200',
    cover: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&q=80&w=1200',
    description: 'نقدم خدمات التصميم الداخلي الشاملة للقصور والفلل والشقق السكنية. نصمم مساحات تعكس هويتك وتلبي احتياجاتك بدقة واحترافية عالية.',
    rating: 4.9,
    reviews: 84,
    completedProjects: 120,
    price: "يبدأ من 50 ر.س/م٢",
    location: 'الرياض، ونقدم استشارات عن بعد',
    features: ['تصميم 3D', 'مخططات تنفيذية', 'إشراف هندسي', 'استشارات مجانية'],
    gallery: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd64bd9b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800'
    ]
  };

  const RELATED_SERVICES = [
    { id: 2, name: 'تنفيذ وتشطيب الديكور', vendor: 'إيوان للتصميم', rating: 4.8, type: 'زيارة معاينة', price: '٤٥٠', img: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&q=80&w=600' },
    { id: 3, name: 'تركيب الأثاث والمطابخ', vendor: 'فن الإنجاز', rating: 4.7, type: 'تحديد موعد', price: '٢٠٠', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&q=80&w=600' },
    { id: 4, name: 'دهانات وديكورات جبسية', vendor: 'لمسات فنية', rating: 4.9, type: 'زيارة معاينة', price: '٣٥٠', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600' },
    { id: 5, name: 'تفصيل وتركيب الستائر', vendor: 'بيت الستائر', rating: 4.6, type: 'تحديد موعد', price: '٣٠٠', img: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&q=80&w=600' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Image */}
      <div 
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => {
          setGalleryIndex(0);
          setIsGalleryOpen(true);
        }}
      >
        <img 
          src={SERVICE_INFO.cover} 
          alt={SERVICE_INFO.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
           <Link to="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
             <ChevronRight size={20} />
           </Link>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
           <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
             <Share2 size={20} />
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Service Header */}
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            
            {/* Logo */}
            <Link to="/provider/1" className="w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-12 md:-mt-16 block hover:opacity-90 transition">
              <img 
                src={SERVICE_INFO.logo} 
                alt={SERVICE_INFO.provider} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200";
                }}
              />
            </Link>

            {/* Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark leading-snug">{SERVICE_INFO.name}</h1>
                <Link to="/provider/1" className="inline-flex items-center gap-1.5 mt-2.5 w-fit text-sm text-gray-400 hover:text-diyar-brown transition-colors group">
                  <User size={15} className="text-diyar-brown" /> مقدم الخدمة:
                  <span className="font-bold text-diyar-dark group-hover:text-diyar-brown transition-colors">{SERVICE_INFO.provider}</span>
                </Link>
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">
                {SERVICE_INFO.description}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 md:gap-3 text-sm">
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-amber-700">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{SERVICE_INFO.rating}</span>
                  <span className="text-amber-700/60">({SERVICE_INFO.reviews} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-500">
                  <MapPin className="w-4 h-4 text-diyar-brown" />
                  <span>{SERVICE_INFO.location}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-diyar-brown/10 px-3 py-1.5 rounded-lg border border-diyar-brown/20 text-diyar-brown font-bold">
                  <span>{SERVICE_INFO.price}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 md:w-auto w-full">
              <button
                onClick={() => {
                  addItem({ type: 'service', name: SERVICE_INFO.name, vendor: SERVICE_INFO.provider, price: SERVICE_INFO.price, img: SERVICE_INFO.logo });
                  setAdded(true);
                }}
                className={`flex-1 md:flex-none font-bold py-3 px-8 rounded-xl transition shadow-md w-full md:w-48 text-center text-lg ${added ? 'bg-green-600 text-white' : 'bg-diyar-dark text-white hover:bg-black'}`}
              >
                {added ? 'أُضيفت للسلة ✓' : 'طلب تنفيذ'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
             <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-diyar-dark mb-4">تفاصيل الخدمة</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {SERVICE_INFO.description}
                  الخدمة تشمل الآتي: دراسة المبنى، تحديد الطراز المناسب، توزيع الأثاث والتوزيع الضوئي، عمل المخططات التنفيذية، وإخراج المناظير ثلاثية الأبعاد للتصميم.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_INFO.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 font-medium">
                      <CheckCircle className="text-green-500 w-5 h-5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-diyar-dark mb-4">نماذج من أعمالنا</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {SERVICE_INFO.gallery.map((img, i) => (
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
                        alt={`Gallery ${i}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-200" 
                        onError={(e) => {
                           (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Reviews Section */}
             <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-diyar-dark mb-4 flex items-center gap-2">
                  <Star className="text-amber-400 fill-amber-400" size={24} />
                  التقييمات والآراء
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl font-bold text-diyar-dark">{SERVICE_INFO.rating}</div>
                  <div className="flex flex-col">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} className={`${star <= Math.floor(SERVICE_INFO.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 mt-1">بناءً على {SERVICE_INFO.reviews} تقييم</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {MOCK_REVIEWS.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold text-sm shrink-0 border border-diyar-brown/20 select-none">
                            {review.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-diyar-dark text-sm">{review.name}</h4>
                            <span className="text-xs text-gray-500">{review.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} className={`${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-lg text-diyar-dark mb-4">تواصل مع المزود</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-3 px-4 rounded-xl hover:bg-green-100 transition flex items-center justify-center gap-2">
                  <Smartphone size={18} /> محادثة عبر الواتساب
                </button>
                <button className="w-full bg-gray-50 text-diyar-dark border border-gray-200 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2">
                  <Mail size={18} /> إرسال رسالة
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-5 shadow-sm">
               <h3 className="font-bold text-lg text-diyar-dark mb-4">معلومات مزود الخدمة</h3>
               <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                 <span className="text-gray-500 text-sm">المشاريع المنجزة</span>
                 <span className="font-bold text-diyar-dark">{SERVICE_INFO.completedProjects}+</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                 <span className="text-gray-500 text-sm">تقييم المزود</span>
                 <span className="font-bold text-diyar-dark flex items-center gap-1">
                   {SERVICE_INFO.rating} <Star size={14} className="fill-amber-400 text-amber-400" />
                 </span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-3">
                 <span className="text-gray-500 text-sm">أوقات العمل</span>
                 <span className="font-medium text-diyar-dark text-sm">9 صباحاً - 5 مساءً</span>
               </div>
               <div className="pt-3">
                 <Link to="/provider/1" className="block w-full text-center bg-gray-50 hover:bg-diyar-brown hover:text-white border border-gray-200 hover:border-diyar-brown text-diyar-dark font-bold py-2.5 rounded-xl text-xs transition-all">
                   زيارة صفحة المزود
                 </Link>
               </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Related Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12 pb-4">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-diyar-dark">خدمات ذات صلة</h2>
          <Link to="/services" className="text-diyar-brown font-bold text-sm hover:underline flex items-center gap-1 shrink-0">
            عرض الكل <ChevronLeft size={16} />
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x pt-2 -mt-2 px-2 -mx-2 md:px-0 md:mx-0">
          {RELATED_SERVICES.map((s) => (
            <div key={s.id} className="min-w-[220px] md:min-w-[260px] snap-start shrink-0">
              <ServiceCard service={s} />
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col justify-center animate-in fade-in duration-300">
           <button 
             onClick={() => setIsGalleryOpen(false)}
             className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full"
           >
             <X size={24} />
           </button>
           
           <div className="relative w-full max-w-5xl mx-auto p-4 md:p-12">
              <div className="aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
                 <img 
                   src={SERVICE_INFO.gallery[galleryIndex % SERVICE_INFO.gallery.length] || SERVICE_INFO.cover} 
                   alt="Gallery" 
                   className="max-w-full max-h-full object-contain"
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800";
                   }}
                 />
              </div>

              {/* Navigation */}
              <div className="absolute inset-y-0 left-4 md:left-8 flex items-center">
                <button 
                  onClick={() => setGalleryIndex((prev) => (prev + 1) % SERVICE_INFO.gallery.length)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>
              <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
                <button 
                  onClick={() => setGalleryIndex((prev) => (prev - 1 + SERVICE_INFO.gallery.length) % SERVICE_INFO.gallery.length)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
           </div>

           {/* Thumbnails */}
           <div className="mt-8 flex justify-center gap-3 px-4 overflow-x-auto scrollbar-hide pb-4">
              {SERVICE_INFO.gallery.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${galleryIndex === i ? 'border-diyar-brown scale-105 shadow-lg' : 'border-transparent opacity-50'}`}
                >
                  <img 
                    src={img} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=60&w=200";
                    }}
                  />
                </button>
              ))}
           </div>
        </div>
      )}

    </div>
  );
}

// Reuse icons 
import { X as XIcon } from 'lucide-react';
const X = XIcon;
