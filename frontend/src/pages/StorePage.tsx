import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Award, ShieldCheck, Share2, Mail, LayoutGrid, Info, Clock, Truck } from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';

export default function StorePage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('products');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const STORE_INFO = {
    id: id || '1',
    name: 'الروائع للأثاث',
    logo: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=200',
    cover: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200',
    description: 'متجر متخصص في صناعة الأثاث الفاخر والقطع الفريدة ذات الجودة العالية والتصاميم العصرية بلمسات كلاسيكية.',
    rating: 4.8,
    reviews: 1250,
    followers: '24K',
    productsCount: 156,
    joinedDate: '2022',
    location: 'الرياض، المملكة العربية السعودية',
    badges: ['متجر موثق', 'توصيل سريع', 'ضمان 5 سنوات']
  };

  const PRODUCTS = [
    { id: 1, name: 'طقم كنب كلاسيكي فاخر - ذهبي', price: '4500', oldPrice: '5200', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 2, name: 'كرسي مريح قماش مخمل - أزرق داكن', price: '850', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 3, name: 'طاولة طعام خشب زان 6 كراسي', price: '3200', oldPrice: '3800', img: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 4, name: 'سرير مزدوج تصميم مودرن مع تخزين', price: '2100', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 5, name: 'طاولة قهوة زجاج مع قاعدة رخام', price: '650', oldPrice: '900', img: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 6, name: 'مكتب عمل منزلي خشب بلوط', price: '1200', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 7, name: 'مكتبة تلفاز جدارية حديثة', price: '1850', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name },
    { id: 8, name: 'أريكة زاوية فخمة للصالون', price: '5400', oldPrice: '6000', img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=400', vendor: STORE_INFO.name }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Cover Image */}
      <div 
        className="w-full h-48 md:h-80 relative bg-diyar-dark cursor-pointer group"
        onClick={() => setIsGalleryOpen(true)}
      >
        <img 
          src={STORE_INFO.cover} 
          alt={STORE_INFO.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-70 transition-opacity"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200";
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
        {/* Store Profile Header */}
        <div className="relative bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 -mt-16 md:-mt-24 mb-8 z-10">
          <div className="flex flex-col md:flex-row gap-6 md:items-end">
            
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl md:rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white shrink-0 -mt-16 md:-mt-20">
              <img 
                src={STORE_INFO.logo} 
                alt={STORE_INFO.name} 
                className="w-full h-full object-cover bg-white"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark">{STORE_INFO.name}</h1>
                <ShieldCheck className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                {STORE_INFO.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-diyar-dark">{STORE_INFO.rating}</span>
                  <span className="text-xs text-gray-400">({STORE_INFO.reviews} تقييم)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-4 h-4 text-diyar-brown" />
                  <span>{STORE_INFO.location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 md:w-auto w-full">
              <button className="flex-1 md:flex-none bg-diyar-brown text-white font-bold py-2.5 px-8 rounded-xl hover:bg-[#856b54] transition shadow-md">
                متابعة
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
              <h3 className="font-bold text-lg text-diyar-dark mb-4">إحصائيات المتجر</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">المتابعون</span>
                  <span className="font-bold text-diyar-dark">{STORE_INFO.followers}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">عدد المنتجات</span>
                  <span className="font-bold text-diyar-dark">{STORE_INFO.productsCount} منتج</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">تاريخ الانضمام</span>
                  <span className="font-bold text-diyar-dark">{STORE_INFO.joinedDate}</span>
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
            <div className="flex border-b border-gray-200 mb-6 font-medium text-sm md:text-base">
              <button 
                onClick={() => setActiveTab('products')}
                className={`py-3 px-6 shrink-0 transition-colors ${activeTab === 'products' ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid size={18} />
                  المنتجات
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`py-3 px-6 shrink-0 transition-colors ${activeTab === 'about' ? 'border-b-2 border-diyar-brown text-diyar-brown font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
              >
                <div className="flex items-center gap-2">
                  <Info size={18} />
                  عن المتجر
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
            {activeTab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-diyar-dark">جميع المنتجات</h2>
                  <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2 px-4 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown">
                    <option>الأحدث</option>
                    <option>الأعلى مبيعاً</option>
                    <option>السعر: من الأقل للأعلى</option>
                    <option>السعر: من الأعلى للأقل</option>
                  </select>
                </div>
                
                {PRODUCTS.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {PRODUCTS.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
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
                <h2 className="text-xl font-bold text-diyar-dark mb-4">نبذة عن المتجر</h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  تأسست "الروائع للأثاث" في عام 2022 بهدف تقديم قطع أثاث فريدة تجمع بين أصالة التصميم الكلاسيكي وعملية التصميم العصري. نحن نؤمن بأن الأثاث ليس مجرد قطع خشبية ومعدنية، بل هو روح المكان التي تعكس شخصية أصحابه.
                  نقدم تشكيلة واسعة من غرف النوم، الصالونات، والمكاتب المنزلية المصنوعة من أجود أنواع الأخشاب والأقمشة العالمية.
                </p>

                <h3 className="font-bold text-lg text-diyar-dark mb-4">أوقات العمل</h3>
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 w-fit">
                  <Clock className="text-diyar-brown shrink-0" />
                  <div>
                    <p className="font-medium">السبت - الخميس: 9:00 صباحاً - 10:00 مساءً</p>
                    <p className="text-sm mt-1">الجمعة: 4:00 عصراً - 10:00 مساءً</p>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-diyar-dark mb-4">سياسة المتجر</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>الاسترجاع متاح خلال 7 أيام من تاريخ الاستلام في حال وجود عيب مصنعي.</li>
                  <li>الشحن مجاني للطلبات التي تزيد عن 3000 ريال داخل الرياض.</li>
                  <li>ضمان لمدة 5 سنوات على الإسفنج والخشب.</li>
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Overview */}
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="text-center md:border-l md:border-gray-150 py-2">
                      <p className="text-5xl font-extrabold text-diyar-dark mb-2">{STORE_INFO.rating}</p>
                      <div className="flex justify-center gap-1 text-amber-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-gray-500 text-xs">تقييم عام بناءً على {STORE_INFO.reviews} رأي</p>
                    </div>
                    
                    <div className="col-span-2 space-y-2">
                      {[
                        { stars: 5, pct: 85, count: 1062 },
                        { stars: 4, pct: 10, count: 125 },
                        { stars: 3, pct: 3, count: 37 },
                        { stars: 2, pct: 1, count: 12 },
                        { stars: 1, pct: 1, count: 14 }
                      ].map((item) => (
                        <div key={item.stars} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-bold shrink-0 w-3">{item.stars}</span>
                          <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 w-10 text-left">{item.pct}%</span>
                          <span className="text-xs text-gray-400 shrink-0 w-12 hidden sm:inline">({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {[
                    { id: 1, name: "سارة العتيبي", rating: 5, date: "منذ يومين", text: "جودة الأثاث رائعة جداً والخدمة في قمة الرقي. طلبت طقم الكنب الكلاسيكي ووصل بنفس المواصفات تماماً واللمسات الذهبية جداً فخمة. شكراً لكم!" },
                    { id: 2, name: "محمد الشهراني", rating: 5, date: "منذ أسبوع", text: "رقي في التعامل، والتزام دقيق بالمواعيد. التوصيل كان سريع والتركيب احترافي جداً ولا توجد أي خدوش. أنصح بالتعامل معهم بشدة." },
                    { id: 3, name: "ريما خالد", rating: 4, date: "منذ أسبوعين", text: "الخامات فخمة جداً ولكن التوصيل تأخر يوم واحد عن الموعد المتفق عليه. بخلاف ذلك الكرسي المخمل مريح جداً ولونه رائع." }
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
                   src={STORE_INFO.cover} 
                   alt="Store Cover" 
                   className="max-w-full max-h-full object-contain"
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=800";
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
