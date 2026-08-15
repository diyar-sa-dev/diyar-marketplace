import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bookmark, ShoppingBag, FolderHeart, ShieldCheck } from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import ServiceCard from '../components/cards/ServiceCard.tsx';

export default function WishlistPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'products' | 'services'>('all');

  const [savedProducts, setSavedProducts] = useState([
    { id: 1, name: "طقم كنب زاوية فاخر", price: "4,500", rating: 4.8, reviews: 124, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800", store: "مفروشات الرقي", tag: "الأكثر مبيعاً" },
    { id: 2, name: "سرير مزدوج مودرن", price: "2,200", rating: 4.5, reviews: 89, img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400", store: "بيت الراحة" },
    { id: 4, name: "خزانة ملابس 6 أبواب", price: "1,950", rating: 4.2, reviews: 34, img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400", store: "إيكيا" },
    { id: 6, name: "كرسي استرخاء مخملي", price: "1,200", rating: 4.7, reviews: 78, img: "https://images.unsplash.com/photo-1598300042247-d317bd127e7b?auto=format&fit=crop&q=80&w=400", store: "أشلي" }
  ]);

  const [savedServices, setSavedServices] = useState([
    { id: 101, name: "تصميم داخلي ثلاثي الأبعاد متكامل", price: "1,500", rating: 4.9, reviews: 45, img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400", vendor: "إيوان للتصميم", type: "استشارة مجانية أولى" },
    { id: 102, name: "مخطط توزيع الإضاءة والكهرباء", price: "750", rating: 4.7, reviews: 29, img: "https://images.unsplash.com/photo-1565538810844-16be962f6840?auto=format&fit=crop&q=80&w=400", vendor: "مكتب الإتقان الهندسي", type: "تحديد موعد حضوري" },
    { id: 103, name: "استشارة معمارية - زاوية البناء", price: "500", rating: 4.6, reviews: 18, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400", vendor: "ارابيسك للتجارة والمقاولات", type: "استشارة أونلاين" }
  ]);

  const totalCount = savedProducts.length + savedServices.length;

  const handleClearAll = () => {
    if (confirm("هل أنت متأكد من تفريغ كافة العناصر المحفوظة؟")) {
      setSavedProducts([]);
      setSavedServices([]);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition">حسابي</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">المحفوظات</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-1 flex items-center gap-2">
              <Bookmark className="text-diyar-brown fill-diyar-brown" size={28} />
              العناصر المحفوظة
            </h1>
            <p className="text-gray-500 text-sm mt-1">تضم المحفوظات الخاصة بك {totalCount} من المنتجات والخدمات المميزة</p>
          </div>
          {totalCount > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-650 font-bold text-sm bg-red-50 hover:bg-red-100/60 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
            >
              تفريغ المحفوظات
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm max-w-md mb-8">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-diyar-dark text-white'
                : 'text-gray-500 hover:text-diyar-brown hover:bg-gray-50'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            onClick={() => setFilterTab('products')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              filterTab === 'products'
                ? 'bg-diyar-dark text-white'
                : 'text-gray-500 hover:text-diyar-brown hover:bg-gray-50'
            }`}
          >
            المنتجات ({savedProducts.length})
          </button>
          <button
            onClick={() => setFilterTab('services')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              filterTab === 'services'
                ? 'bg-diyar-dark text-white'
                : 'text-gray-500 hover:text-diyar-brown hover:bg-gray-50'
            }`}
          >
            الخدمات ({savedServices.length})
          </button>
        </div>

        {/* Saved Items Grid */}
        {totalCount > 0 ? (
          <div>
            {/* Products Sub-section */}
            {(filterTab === 'all' || filterTab === 'products') && (
              <div className="mb-10">
                {filterTab === 'all' && savedProducts.length > 0 && (
                  <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-diyar-brown rounded-full"></span>
                    المنتجات المحفوظة ({savedProducts.length})
                  </h2>
                )}
                {savedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
                    {savedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  filterTab === 'products' && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <ShoppingBag size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-diyar-dark mb-1">لا توجد منتجات محفوظة</h3>
                      <p className="text-gray-500 text-sm max-w-sm mb-4">تصفح أقسام الأثاث والمستلزمات واحفظ منتجاتك المفضلة هنا!</p>
                      <Link to="/category/all" className="bg-diyar-brown text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition">
                        تسوق الأثاث
                      </Link>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Services Sub-section */}
            {(filterTab === 'all' || filterTab === 'services') && (
              <div>
                {filterTab === 'all' && savedServices.length > 0 && (
                  <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-diyar-brown rounded-full"></span>
                    الخدمات المحفوظة ({savedServices.length})
                  </h2>
                )}
                {savedServices.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4">
                    {savedServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                ) : (
                  filterTab === 'services' && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <FolderHeart size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-diyar-dark mb-1">لا توجد خدمات محفوظة</h3>
                      <p className="text-gray-500 text-sm max-w-sm mb-4">استكشف مقدمي الخدمات الهندسية ومخططي الديكور المناسبين لمشروعك.</p>
                      <Link to="/" className="bg-diyar-brown text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition">
                        استكشف الخدمات
                      </Link>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300 relative">
              <Bookmark size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-diyar-dark mb-2">قائمة المحفوظات فارغة</h3>
            <p className="text-gray-500 mb-8 max-w-md">لم تقم بإضافة أي منتجات أو خدمات إلى قائمة المحفوظات حتى الآن. اضغط على أيقونة الحفظ لتجده هنا لاحقاً.</p>
            <div className="flex gap-4">
              <Link to="/category/all" className="bg-diyar-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all">
                تصفح المنتجات
              </Link>
              <Link to="/" className="bg-gray-100 text-diyar-dark px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                الرئيسية
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
