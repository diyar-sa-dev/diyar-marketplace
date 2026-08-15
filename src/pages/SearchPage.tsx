import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ProductCard from '../components/cards/ProductCard.tsx';
import { Store, Paintbrush, ChevronLeft, Camera, Star } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchPage() {
  const query = useQuery();
  const searchQuery = query.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'stores' | 'services'>('all');

  const allProducts = [
    { id: 1, name: "طقم كنب زاوية فاخر", price: "4,500", rating: 4.8, reviews: 124, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800", store: "مفروشات الرقي", tag: "الأكثر مبيعاً" },
    { id: 2, name: "سرير مزدوج مودرن", price: "2,200", rating: 4.5, reviews: 89, img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400", store: "بيت الراحة" },
    { id: 3, name: "طاولة طعام خشب رخام", price: "3,800", rating: 4.9, reviews: 56, img: "https://images.unsplash.com/photo-1560606177-063fb90494f4?auto=format&fit=crop&q=80&w=400", store: "إيوان للتصميم" },
    { id: 4, name: "خزانة ملابس 6 أبواب", price: "1,950", rating: 4.2, reviews: 34, img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400", store: "إيكيا" },
    { id: 5, name: "طاولة قهوة زجاجية", price: "850", rating: 4.6, reviews: 112, img: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400", store: "ويست إلم", tag: "وصل حديثاً" },
    { id: 6, name: "كرسي استرخاء مخملي", price: "1,200", rating: 4.7, reviews: 78, img: "https://images.unsplash.com/photo-1598300042247-d317bd127e7b?auto=format&fit=crop&q=80&w=400", store: "أشلي" },
  ];

  const allStores = [
    { id: 1, name: "إيكيا", type: "أثاث منزلي", logo: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=200", rating: 4.8 },
    { id: 2, name: "أشلي", type: "أثاث كلاسيكي ومودرن", logo: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=200", rating: 4.6 },
    { id: 3, name: "مفروشات الرقي", type: "أثاث محلي فاخر", logo: "https://images.unsplash.com/photo-1583847268964-b28ce8f30e9b?auto=format&fit=crop&q=80&w=200", rating: 4.9 },
  ];

  const allServices = [
    { id: 1, name: "تصميم داخلي متكامل", provider: "إيوان للتصميم", rating: 4.9, price: "يبدأ من 50 ر.س/م٢", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "تفصيل خزائن غرف نوم", provider: "نجارة الأحمد", rating: 4.7, price: "حسب المقاس", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400" },
  ];

  const isVisualSearch = searchQuery === 'visual_search_results';

  let filteredProducts = (searchQuery && !isVisualSearch) ? allProducts.filter(p => p.name.includes(searchQuery) || p.store.includes(searchQuery)) : allProducts;
  let filteredStores = (searchQuery && !isVisualSearch) ? allStores.filter(s => s.name.includes(searchQuery) || s.type.includes(searchQuery)) : allStores;
  let filteredServices = (searchQuery && !isVisualSearch) ? allServices.filter(s => s.name.includes(searchQuery) || s.provider.includes(searchQuery)) : allServices;

  if (isVisualSearch) {
    filteredStores = [];
    filteredServices = [];
  }

  let hasExactMatches = true;
  if (filteredProducts.length === 0 && filteredStores.length === 0 && filteredServices.length === 0) {
    hasExactMatches = false;
    filteredProducts = allProducts;
    filteredStores = allStores;
    filteredServices = allServices;
  }

  const totalResults = filteredProducts.length + filteredStores.length + filteredServices.length;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <span>نتائج البحث</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2 flex items-center gap-2">
            {isVisualSearch ? (
              <>
                <Camera className="text-diyar-brown" size={24} />
                <span>نتائج البحث للصور المشابهة</span>
              </>
            ) : (
              <span>نتائج البحث عن "{searchQuery}"</span>
            )}
          </h1>
          {hasExactMatches ? (
            <p className="text-gray-500 text-sm">وجدنا {totalResults} نتيجة مطابقة {isVisualSearch ? 'للصورة' : 'لبحثك'}</p>
          ) : (
            <p className="text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block text-xs">لم نجد نتائج مطابقة تماماً {isVisualSearch ? 'للصورة المرفوعة' : 'لبحثك'}، لكننا نقترح عليك هذه النتائج المميزة</p>
          )}

          {isVisualSearch && (
            <div className="mt-4 flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 w-fit shadow-sm">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
                    <img 
                      src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&q=80&w=200" 
                      alt="الصورة المرفوعة" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                </div>
                <div>
                   <p className="text-sm font-bold text-diyar-dark mb-1">صورتك المرفوعة</p>
                   <p className="text-xs text-gray-500">تم تحليل الصورة والبحث عن منتجات مشابهة.</p>
                </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!isVisualSearch && (
        <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-8">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            الكل ({totalResults})
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'products' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            المنتجات ({filteredProducts.length})
          </button>
          <button 
            onClick={() => setActiveTab('stores')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'stores' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            المتاجر ({filteredStores.length})
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'services' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            الخدمات ({filteredServices.length})
          </button>
        </div>
        )}

        {totalResults === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-diyar-dark mb-2">لم نجد أي نتائج</h3>
            <p className="text-gray-500 mb-8 max-w-md">نعتذر، لم نتمكن من العثور على ما تبحث عنه. يرجى التحقق من الإملاء أو تجربة كلمات مفتاحية مختلفة.</p>
            <Link to="/" className="bg-diyar-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all">
              العودة للرئيسية
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Stores Section */}
            {(activeTab === 'all' || activeTab === 'stores') && filteredStores.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Store size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-diyar-dark">المتاجر والعلامات التجارية</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredStores.map(store => (
                    <Link to={`/store/${store.id}`} key={store.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow group">
                      <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 group-hover:border-blue-100 transition-colors">
                        <img src={store.logo} alt={store.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-diyar-dark text-sm mb-1">{store.name}</h3>
                        <p className="text-gray-500 text-xs mb-1">{store.type}</p>
                        <div className="flex items-center text-[11px] text-gray-500 gap-1">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span>{store.rating} تقييم</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Services Section */}
            {(activeTab === 'all' || activeTab === 'services') && filteredServices.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Paintbrush size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-diyar-dark">الخدمات</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredServices.map(service => (
                    <Link to={`/service/${service.id}`} key={service.id} className="min-w-[280px] md:min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all snap-start group">
                      <div className="h-40 relative overflow-hidden">
                        <img 
                          src={service.image} 
                          alt={service.name} 
                          referrerPolicy="no-referrer" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-200" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                          <Star size={12} className="text-amber-400 fill-amber-400" /> {service.rating}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-diyar-dark text-base mb-1 truncate">{service.name}</h3>
                        <p className="text-gray-500 mb-3 text-sm flex items-center gap-1.5 truncate">
                          <Store size={14} /> <span className="font-medium text-diyar-dark truncate">{service.provider}</span>
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                           <span className="font-bold text-diyar-brown text-sm">{service.price}</span>
                           <div className="flex items-center text-xs text-diyar-dark font-medium gap-1 bg-diyar-cream/30 px-3 py-1.5 rounded-lg border border-diyar-cream group-hover:bg-diyar-brown group-hover:text-white transition-colors">
                             طلب تنفيذ
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {(activeTab === 'all' || activeTab === 'products') && filteredProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-diyar-dark">المنتجات</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
